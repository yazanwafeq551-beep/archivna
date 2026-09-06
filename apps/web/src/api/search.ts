import apiClient from "./client";
import type { Archive, ArchiveListResponse } from "./archives";

export interface SearchFilters {
  q?: string;
  materialType?: string[];
  /** Institution id, chosen from the register. */
  institution?: string;
  dateFrom?: string;
  dateTo?: string;
  subject?: string;
  place?: string;
  language?: string;
  accessLevel?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SearchSuggestions {
  subjects: string[];
  institutions: string[];
  places: string[];
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export const searchApi = {
  search: async (filters: SearchFilters): Promise<ArchiveListResponse> => {
    const rawParams: Record<string, string | number | undefined> = {};

    if (filters.q) rawParams.q = filters.q;
    if (filters.materialType?.length) rawParams.material_type = filters.materialType.join(',');
    if (filters.institution) rawParams.institution_id = filters.institution;
    if (filters.dateFrom) rawParams.date_from = filters.dateFrom;
    if (filters.dateTo) rawParams.date_to = filters.dateTo;
    if (filters.subject) rawParams.subject = filters.subject;
    if (filters.place) rawParams.place = filters.place;
    if (filters.language) rawParams.language = filters.language;
    if (filters.accessLevel?.length) rawParams.access_level = filters.accessLevel.join(',');
    if (filters.sort) rawParams.sort = filters.sort;
    if (filters.page) rawParams.page = filters.page;
    if (filters.limit) rawParams.limit = filters.limit;

    const response = await apiClient.get("/search", { params: rawParams });
    return response.data;
  },

  getSuggestions: async (q: string): Promise<SearchSuggestions> => {
    const response = await apiClient.get("/search/suggestions", { params: { q } });
    return response.data;
  },

  getRecentSearches: async (): Promise<string[]> => {
    const response = await apiClient.get("/search/recent");
    return response.data;
  },

  getPopularSearches: async (): Promise<string[]> => {
    const response = await apiClient.get("/search/popular");
    return response.data;
  },
};
