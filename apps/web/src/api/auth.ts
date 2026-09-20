import apiClient from "./client";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/lib/nativeSession";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  institutionName?: string;
  institutionId?: string;
  accountType?: string;
  avatarPath?: string;
  avatarUrl?: string;
  bio?: string;
  preferredLanguage?: string;
  theme?: string;
  textSize?: string;
  reducedMotion?: boolean;
  accountStatus?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  roleAssignments?: Array<{ id: string; role: string; institutionId?: string }>;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** When false the session ends with the browser session. */
  rememberMe?: boolean;
}

export interface NewInstitutionInput {
  nameAr: string;
  nameEn?: string;
  institutionType?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  website?: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  institutionName?: string;
  institutionId?: string;
  accountType?: "individual" | "institution_representative";
  /** Registers the institution together with the account. */
  newInstitution?: NewInstitutionInput;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  /**
   * Only for clients that keep their own token - a browser gets an httpOnly
   * cookie instead and never sees this field.
   */
  refreshToken?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", data);
    await setRefreshToken(response.data?.refreshToken ?? null);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register", data);
    await setRefreshToken(response.data?.refreshToken ?? null);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // The server only revokes a chain when it is handed the token, and a
    // native client has no cookie to send. Without this, signing out would
    // leave a live refresh token on the device for a week.
    const refreshToken = await getRefreshToken();
    try {
      await apiClient.post("/auth/logout", refreshToken ? { refreshToken } : {});
    } finally {
      // Sign out locally even if the request never landed; the alternative
      // is an app that refuses to log out while offline.
      await clearRefreshToken();
    }
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/refresh");
    await setRefreshToken(response.data?.refreshToken ?? null);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post("/auth/reset-password", { token, password });
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};
