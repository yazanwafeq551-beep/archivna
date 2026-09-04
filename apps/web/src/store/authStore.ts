import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import i18n from "@/i18n";
import { authApi, type User } from "@/api/auth";
import { setAccessToken, getAccessToken, refreshSession, setOnSessionExpired } from "@/api/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True once the session has been checked, whatever the outcome. */
  sessionChecked: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  institutionName?: string;
  institutionId?: string;
  accountType?: "individual" | "institution_representative";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Refresh this long before the access token expires. */
const REFRESH_LEAD_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;

function getTokenExpiry(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1] ?? ""));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasAuthenticated = useRef(false);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    // Personal data must not survive into the next session in this tab.
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    wasAuthenticated.current = !!user;
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await authApi.getProfile());
    } catch {
      // The client already clears the session when it is genuinely gone;
      // a transient failure must not sign the user out.
    }
  }, []);

  /**
   * Keeps the access token ahead of its own expiry so ordinary navigation never
   * races a 401.
   */
  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);

    const expiresAt = getTokenExpiry(getAccessToken());
    if (!expiresAt) return;

    const delay = Math.max(expiresAt - Date.now() - REFRESH_LEAD_MS, MIN_REFRESH_DELAY_MS);
    refreshTimer.current = setTimeout(() => {
      refreshSession()
        .then((session) => {
          setUser(session.user as unknown as User);
          scheduleRefresh();
        })
        .catch(() => {
          // Retry once near the actual expiry; the response interceptor still
          // covers the case where the token dies first.
          refreshTimer.current = setTimeout(() => scheduleRefresh(), MIN_REFRESH_DELAY_MS);
        });
    }, delay);
  }, []);

  useEffect(() => {
    let active = true;

    refreshSession()
      .then((session) => {
        if (!active) return;
        setUser(session.user as unknown as User);
        scheduleRefresh();
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
        setSessionChecked(true);
      });

    return () => {
      active = false;
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    setOnSessionExpired(() => {
      const shouldNotify = wasAuthenticated.current;
      clearSession();
      if (shouldNotify) {
        toast.error(i18n.t("error.sessionExpired"));
      }
    });
    return () => setOnSessionExpired(null);
  }, [clearSession]);

  useEffect(() => {
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  /**
   * A tab that slept through the token's lifetime (laptop closed, background
   * tab) revalidates as soon as it is looked at again.
   */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if (!user) return;

      const expiresAt = getTokenExpiry(getAccessToken());
      if (expiresAt && expiresAt - Date.now() > REFRESH_LEAD_MS) return;

      refreshSession()
        .then((session) => {
          setUser(session.user as unknown as User);
          scheduleRefresh();
        })
        .catch(() => undefined);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [user, scheduleRefresh]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      const response = await authApi.login({ email, password, rememberMe });
      setAccessToken(response.accessToken);
      setUser(response.user);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      const response = await authApi.register(data);
      setAccessToken(response.accessToken);
      setUser(response.user);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
        sessionChecked,
        login,
        register,
        logout,
        refreshUser,
      },
    },
    children
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
