import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, type User } from "@/api/auth";
import { setAccessToken, getAccessToken, setOnUnauthorized } from "@/api/client";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    institutionName?: string;
    institutionId?: string;
    accountType?: "individual" | "institution_representative";
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getProfile();
      setUser(userData);
    } catch {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authApi.refresh();
        setAccessToken(response.accessToken);
        setUser(response.user);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      setAccessToken(null);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    institutionName?: string;
    institutionId?: string;
    accountType?: "individual" | "institution_representative";
  }) => {
    const response = await authApi.register(data);
    setAccessToken(response.accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated: !!user,
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
