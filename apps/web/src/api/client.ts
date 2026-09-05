import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

/**
 * Empty in development and wherever the API is proxied under the same domain;
 * set to the API's origin when the two are deployed separately.
 */
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const apiClient = axios.create({
  baseURL: `${API_ORIGIN}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export interface SessionUser {
  id: string;
  email: string;
  [key: string]: unknown;
}

export interface Session {
  accessToken: string;
  user: SessionUser;
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

export function refreshSession(): Promise<Session> {
  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_ORIGIN}/api/v1/auth/refresh`, {}, { withCredentials: true })
      .then((response) => {
        const session = response.data as Session;
        setAccessToken(session.accessToken);
        return session;
      })
      .finally(() => {
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
        onSessionExpired?.();
      }
      return Promise.reject(error);
    }
  }
);

export default apiClient;
