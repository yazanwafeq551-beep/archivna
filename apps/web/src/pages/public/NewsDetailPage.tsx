import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/api/news";
import { NewsArticle } from "@/components/news/NewsArticle";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";

export function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["news", slug],
    queryFn: () => newsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;
  if (!article) return <ErrorState title={t("archive.notFound")} />;

  return (
    <div className="container-app py-8 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: t("news.title"), href: "/news" },
          { label: article.titleAr },
        ]}
      />
      <NewsArticle article={article} />
    </div>
  );
}
