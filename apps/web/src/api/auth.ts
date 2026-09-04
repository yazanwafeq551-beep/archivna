import apiClient from "./client";

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

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  institutionName?: string;
  institutionId?: string;
  accountType?: "individual" | "institution_representative";
}

export interface AuthResponse {
  accessToken: string;
  user: User;
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
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout");
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/refresh");
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
