import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/api/news";
import { NewsCard } from "@/components/news/NewsCard";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";

export function NewsListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");

  const { data, isLoading, error } = useQuery({
    queryKey: ["news", page],
    queryFn: () => newsApi.getAll(page, 9),
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  return (
    <div className="container-app py-8">
      <h1 className="mb-8 text-2xl md:text-3xl font-heading font-bold text-foreground">
        {t("news.title")}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => window.location.reload()} />
      ) : data && data.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.data.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          {data.meta.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState title={t("empty.news")} description={t("empty.newsDesc")} />
      )}
    </div>
  );
}
