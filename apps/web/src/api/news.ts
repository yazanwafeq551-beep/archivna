import apiClient from "./client";

export interface NewsArticle {
  id: string;
  titleAr: string;
  titleEn?: string;
  slug: string;
  excerptAr?: string;
  excerptEn?: string;
  contentAr: string;
  contentEn?: string;
  coverImagePath?: string;
  status: string;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    nameAr: string;
    nameEn: string;
    slug: string;
  };
}

export interface NewsListResponse {
  data: NewsArticle[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const newsApi = {
  getAll: async (page?: number, limit?: number): Promise<NewsListResponse> => {
    const response = await apiClient.get("/news", {
      params: { page, limit },
    });
    return response.data;
  },

  getBySlug: async (slug: string): Promise<NewsArticle> => {
    const response = await apiClient.get(`/news/${slug}`);
    return response.data;
  },

  getLatest: async (limit?: number): Promise<NewsArticle[]> => {
    const response = await apiClient.get("/news/latest", { params: { limit } });
    return response.data;
  },
};
