import { useQuery } from "@tanstack/react-query";
import { searchApi, type SearchFilters } from "@/api/search";
import { useState, useCallback } from "react";

export function useSearch(filters: SearchFilters) {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () => searchApi.search(filters),
    enabled: true,
    placeholderData: (prev) => prev,
  });
}

export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ["searchSuggestions", q],
    queryFn: () => searchApi.getSuggestions(q),
    enabled: q.length >= 2,
  });
}

export function useRecentSearches() {
  return useQuery({
    queryKey: ["recentSearches"],
    queryFn: () => searchApi.getRecentSearches(),
  });
}

export function usePopularSearches() {
  return useQuery({
    queryKey: ["popularSearches"],
    queryFn: () => searchApi.getPopularSearches(),
  });
}

export function useSearchState(initialFilters?: Partial<SearchFilters>) {
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    materialType: [],
    accessLevel: [],
    sort: "relevance",
    page: 1,
    limit: 12,
    ...initialFilters,
  });

  const updateFilter = useCallback((key: keyof SearchFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : (value as number),
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      q: filters.q,
      materialType: [],
      accessLevel: [],
      sort: "relevance",
      page: 1,
      limit: 12,
    });
  }, [filters.q]);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    setPage,
  };
}
