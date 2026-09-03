import apiClient from "./client";
import type { User } from "./auth";

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  institution?: string;
  bio?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileApi = {
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get("/profile");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await apiClient.put("/profile", data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await apiClient.post("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await apiClient.delete("/profile/avatar");
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await apiClient.put("/profile/password", data);
  },
};
