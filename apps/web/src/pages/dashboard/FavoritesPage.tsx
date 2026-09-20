import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { favoritesApi } from "@/api/favorites";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Heart } from "lucide-react";

export function FavoritesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["favorites", page],
    queryFn: () => favoritesApi.getAll(page, 12),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        {t("dashboard.favorites.title")}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((archive) => (
              <ArchiveCard key={archive.id} archive={archive} />
            ))}
          </div>
          {data.meta.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      ) : (
        <EmptyState
          title={t("empty.favorites")}
          description={t("empty.favoritesDesc")}
          icon={<Heart className="h-12 w-12 text-muted" />}
        />
      )}
    </div>
  );
}
