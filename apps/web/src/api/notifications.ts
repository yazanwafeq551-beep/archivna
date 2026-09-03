import apiClient from "./client";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationResponse {
  data: Notification[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationsApi = {
  getAll: async (page?: number, limit?: number): Promise<NotificationResponse> => {
    const response = await apiClient.get("/notifications", {
      params: { page, limit },
    });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch("/notifications/read-all");
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
