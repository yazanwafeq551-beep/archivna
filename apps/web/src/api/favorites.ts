import apiClient from "./client";
import type { Archive, ArchiveListResponse } from "./archives";

export interface FavoriteResponse {
  id: string;
  archiveId: string;
  userId: string;
  createdAt: string;
}

export const favoritesApi = {
  getAll: async (page?: number, limit?: number): Promise<ArchiveListResponse> => {
    const response = await apiClient.get("/favorites", {
      params: { page, limit },
    });
    return response.data;
  },

  check: async (archiveId: string): Promise<{ isFavorite: boolean }> => {
    try {
      const response = await apiClient.get(`/favorites`);
      const favorites: ArchiveListResponse = response.data;
      const isFavorite = favorites.data?.some((a: Archive) => a.id === archiveId) || false;
      return { isFavorite };
    } catch {
      return { isFavorite: false };
    }
  },

  add: async (archiveId: string): Promise<FavoriteResponse> => {
    const response = await apiClient.post(`/favorites/${archiveId}`);
    return response.data;
  },

  remove: async (archiveId: string): Promise<void> => {
    await apiClient.delete(`/favorites/${archiveId}`);
  },

  toggle: async (archiveId: string): Promise<{ isFavorite: boolean }> => {
    const { isFavorite } = await favoritesApi.check(archiveId);
    if (isFavorite) {
      await apiClient.delete(`/favorites/${archiveId}`);
      return { isFavorite: false };
    }
    await apiClient.post(`/favorites/${archiveId}`);
    return { isFavorite: true };
  },
};
