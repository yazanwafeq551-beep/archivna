import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Grid3X3, List, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { SearchFilters } from "@/components/archive/SearchFilters";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useSearch, useSearchState } from "@/hooks/useSearch";
import { SORT_OPTIONS } from "@/lib/constants";

export function SearchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // The home hub offers "search by institution or collection" as its own
  // entry point; arriving that way should put the reader in the filter, not
  // leave them hunting for it behind a button.
  const browsingInstitutions = searchParams.get("browse") === "institution";
  const [filtersOpen, setFiltersOpen] = useState(browsingInstitutions);

  const urlFilters = useMemo(() => ({
    q: searchParams.get("q") || "",
    materialType: searchParams.get("type") ? [searchParams.get("type")!] : [],
    institution: searchParams.get("institution") || "",
    sort: searchParams.get("sort") || "relevance",
    page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1,
  }), []);

  const { filters, updateFilter, resetFilters, setPage } = useSearchState(urlFilters);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set("q", filters.q);
    if (filters.materialType?.length) params.set("type", filters.materialType[0]);
    if (filters.institution) params.set("institution", filters.institution);
    if (filters.page && filters.page > 1) params.set("page", String(filters.page));
    if (filters.sort && filters.sort !== "relevance") params.set("sort", filters.sort);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading, error } = useSearch(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("page", 1);
  };

  const activeFilterCount = [
    filters.materialType?.length,
    filters.institution,
    filters.dateFrom,
    filters.dateTo,
    filters.subject,
    filters.place,
    filters.language,
    filters.accessLevel?.length,
  ].filter(Boolean).length;

  return (
    <div className="container-app py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="mb-4 text-2xl md:text-3xl font-heading font-bold text-foreground">
          {t("search.title")}
        </h1>
        <form onSubmit={handleSearch}>
          <Input
            type="search"
            placeholder={t("search.placeholder")}
            value={filters.q || ""}
            onChange={(e) => updateFilter("q", e.target.value)}
            className="h-12 text-base"
            icon={<Search className="h-5 w-5" />}
          />
        </form>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="mb-4 font-semibold text-foreground">{t("search.filters")}</h2>
            <SearchFilters
              filters={filters}
              onFilterChange={updateFilter}
              onReset={resetFilters}
              focusInstitution={browsingInstitutions}
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Results Header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile Filters */}
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="ms-1 h-4 w-4" />
                    {t("search.filters")}
                    {activeFilterCount > 0 && (
                      <Badge className="ms-1 h-5 min-w-5 p-0 flex items-center justify-center">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="end" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>{t("search.filters")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <SearchFilters
                      filters={filters}
                      onFilterChange={updateFilter}
                      onReset={resetFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {data && (
                <p className="text-sm text-muted">
                  {t("search.showing")} {data.data.length} {t("search.of")} {data.meta.total} {t("search.results")}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={filters.sort || "relevance"}
                onValueChange={(value) => updateFilter("sort", value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t("search.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t("sort." + option.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="hidden sm:flex items-center border border-border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="h-9 w-9 rounded-none rounded-e-md"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="h-9 w-9 rounded-none rounded-s-md"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {filters.materialType?.map((type) => (
                <Badge key={type} variant="secondary" className="gap-1">
                  {type}
                  <button onClick={() => {
                    updateFilter("materialType", filters.materialType?.filter((t) => t !== type) || []);
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.accessLevel?.map((level) => (
                <Badge key={level} variant="secondary" className="gap-1">
                  {level}
                  <button onClick={() => {
                    updateFilter("accessLevel", filters.accessLevel?.filter((l) => l !== level) || []);
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.institution && (
                <Badge variant="secondary" className="gap-1">
                  {filters.institution}
                  <button onClick={() => updateFilter("institution", "")}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                {t("search.clearAll")}
              </Button>
            </div>
          )}

          {/* Results Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState onRetry={() => window.location.reload()} />
          ) : data && data.data.length > 0 ? (
            <>
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }>
                {data.data.map((archive) => (
                  <ArchiveCard key={archive.id} archive={archive} viewMode={viewMode} />
                ))}
              </div>

              {data.meta.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={filters.page || 1}
                    totalPages={data.meta.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title={t("empty.searchResults")}
              description={t("empty.searchResultsDesc")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
