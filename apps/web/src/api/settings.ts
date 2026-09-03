import apiClient from "./client";

export interface UserSettings {
  language: "ar" | "en";
  theme: "light" | "dark" | "system";
  textSize: "small" | "medium" | "large" | "normal";
  reducedMotion: boolean;
  emailNotifications: boolean;
}

export const settingsApi = {
  getSettings: async (): Promise<UserSettings> => {
    const response = await apiClient.get("/settings");
    return response.data;
  },

  updateSettings: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiClient.put("/settings", settings);
    return response.data;
  },
};
