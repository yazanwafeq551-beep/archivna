import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { isNative } from "@/lib/platform";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/lib/nativeSession";

/**
 * Empty in development and wherever the API is proxied under the same domain;
 * set to the API's origin when the two are deployed separately.
 */
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

/**
 * Long, because the API sleeps when idle on its current hosting plan and a
 * cold start can hold the connection open for a minute before the first
 * byte arrives. The point is not to be strict - it is that axios without a
 * timeout waits forever, so a stalled request on a phone spins a button
 * with no error, no message and no way back.
 */
const REQUEST_TIMEOUT_MS = 90_000;

const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

export interface SessionUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface Session {
  accessToken: string;
  user: SessionUser;
  /** Present only for clients that carry their own token; never in a browser. */
  refreshToken?: string;
}

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

/**
 * Refresh rotates the token server side, so two parallel calls would invalidate
 * each other. Every caller shares one in-flight request instead.
 */
let refreshRequest: Promise<Session> | null = null;

/** Requests that must never trigger a refresh - they are the session itself. */
const SESSION_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler;
}

function isSessionEndpoint(url?: string) {
  if (!url) return false;
  return SESSION_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export const NATIVE_CLIENT_HEADER = "X-Client";

/**
 * A missing session has to look like one. `isTransientFailure` reads a
 * status-less error as "the network stumbled" and keeps the app waiting, so
 * a plain Error here would strand a signed-out app half-authenticated for
 * good instead of sending it to the login screen.
 */
function noSessionError(): AxiosError {
  const error = new AxiosError(
    "No stored refresh token.",
    AxiosError.ERR_BAD_REQUEST
  );
  error.response = { status: 401 } as AxiosResponse;
  return error;
}

export function refreshSession(): Promise<Session> {
  if (!refreshRequest) {
    // Assigned before the first await, so concurrent callers still share
    // the one in-flight request rather than racing the rotation.
    refreshRequest = (async () => {
      const native = isNative();
      const storedToken = native ? await getRefreshToken() : null;

      if (native && !storedToken) throw noSessionError();

      const response = await axios.post(
        `${API_ORIGIN}/api/v1/auth/refresh`,
        storedToken ? { refreshToken: storedToken } : {},
        {
          withCredentials: true,
          // This call bypasses apiClient, so it needs the timeout too -
          // and it runs at startup, where a hang shows no UI at all.
          timeout: REQUEST_TIMEOUT_MS,
          // This call bypasses apiClient, so it has to say so itself.
          headers: native ? { [NATIVE_CLIENT_HEADER]: "native" } : undefined,
        }
      );

      const session = response.data as Session;
      setAccessToken(session.accessToken);

      // The server rotates on every use: keeping the old token would leave
      // the device holding a credential that is already spent.
      if (session.refreshToken) await setRefreshToken(session.refreshToken);

      return session;
    })().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

/** A refresh that failed for any reason other than "no valid session". */
function isTransientFailure(error: unknown) {
  const status = (error as AxiosError)?.response?.status;
  return status === undefined || status === 429 || status >= 500;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // An upload is measured in megabytes and minutes, so the timeout that
  // protects ordinary calls would abort it halfway. It has its own signal
  // that it is alive: onUploadProgress.
  if (String(config.headers["Content-Type"] ?? "").includes("multipart/form-data")) {
    config.timeout = 0;
  }
  if (isNative()) {
    config.headers[NATIVE_CLIENT_HEADER] = "native";
  }
  return config;
});

/**
 * A misconfigured API origin makes every call land on the SPA's own index.html,
 * which arrives as a 200 carrying a long HTML string. Callers then treat that
 * string as their payload - its `.length` is truthy - and the page dies on the
 * first `.map`. Anything that is not JSON is a failure, not data.
 */
function assertJsonResponse(response: AxiosResponse) {
  const responseType = response.config.responseType;
  if (responseType && responseType !== "json") return response;

  const contentType = String(response.headers?.["content-type"] ?? "");
  if (contentType.includes("application/json")) return response;

  throw new AxiosError(
    `Expected JSON from ${response.config.url ?? "the API"} but received ${contentType || "an unknown content type"}.`,
    AxiosError.ERR_BAD_RESPONSE,
    response.config,
    response.request,
    response
  );
}

apiClient.interceptors.response.use(
  (response) => assertJsonResponse(response),
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isSessionEndpoint(originalRequest.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const session = await refreshSession();
      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
      return await apiClient(originalRequest);
    } catch (refreshError) {
      // A rate limit, a server hiccup or an offline moment is not a logout.
      if (!isTransientFailure(refreshError)) {
        setAccessToken(null);
        // The stored token is the reason a native app stays signed in. Once
        // the server has rejected it, keeping it only guarantees that every
        // later refresh fails the same way.
        void clearRefreshToken();
        onSessionExpired?.();
      }
      return Promise.reject(error);
    }
  }
);

export default apiClient;
