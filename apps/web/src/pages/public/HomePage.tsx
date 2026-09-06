import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, Download, Building, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewsCard } from "@/components/news/NewsCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useArchiveStats } from "@/hooks/useArchive";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/api/news";
import { HomeHero } from "@/components/home/HomeHero";
import { PlatformServices } from "@/components/home/PlatformServices";
import { AccessCta } from "@/components/home/AccessCta";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";
import { ArchivalPattern } from "@/components/illustrations/ArchivalPattern";

const statIcons: Record<string, React.ReactNode> = {
  totalRecords: <Archive className="h-8 w-8" />,
  totalUsers: <Users className="h-8 w-8" />,
  totalDownloads: <Download className="h-8 w-8" />,
  totalInstitutions: <Building className="h-8 w-8" />,
};

/**
 * The home page is the platform's map: the masthead, the seven services, and
 * the two doors in. Browsing the archive itself belongs to the sections those
 * cards open, so the page keeps only the two things that are about the platform
 * as a whole - what it holds, and what is new.
 */
export function HomePage() {
  const { t, i18n } = useTranslation();

  const { data: stats, isLoading: statsLoading } = useArchiveStats();
  const { data: latestNews, isLoading: newsLoading } = useQuery({
    queryKey: ["latestNews"],
    queryFn: () => newsApi.getLatest(3),
  });

  return (
    <div>
      <HomeHero>
        <PlatformServices />
        <AccessCta />
      </HomeHero>

      {/* Statistics */}
      <section className="py-12 md:py-16 bg-primary-dark text-white relative overflow-hidden">
        <ArchivalPattern variant="diamond" className="absolute inset-0 w-full h-full opacity-50" />
        <div className="container-app relative z-10">
          <div className="mb-10 text-center">
            <SectionDecoration className="mb-4 [&>*]:!border-white/30 [&>*]:!bg-white/30" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold">
              {t("home.stats.title")}
            </h2>
          </div>
          {statsLoading ? (
            <LoadingSpinner />
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { key: "totalRecords", label: t("home.stats.totalRecords"), value: stats.totalRecords, icon: statIcons.totalRecords },
                { key: "totalUsers", label: t("home.stats.totalUsers"), value: stats.totalUsers, icon: statIcons.totalUsers },
                { key: "totalDownloads", label: t("home.stats.totalDownloads"), value: stats.totalDownloads, icon: statIcons.totalDownloads },
                { key: "totalInstitutions", label: t("home.stats.totalInstitutions"), value: stats.totalInstitutions, icon: statIcons.totalInstitutions },
              ].map((stat) => (
                <div key={stat.key} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10 text-gold">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-gold">
                    {stat.value.toLocaleString(i18n.language)}
                  </div>
                  <div className="mt-1 text-sm text-white/60">{stat.label}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Latest News */}
      <section className="py-12 md:py-16 relative">
        <ArchivalPattern variant="dots" className="absolute inset-0 w-full h-full" />
        <div className="container-app relative z-10">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                {t("home.news.title")}
              </h2>
              <p className="mt-1 text-muted">{t("home.news.subtitle")}</p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link to="/news">{t("home.news.viewAll")}</Link>
            </Button>
          </div>
          {newsLoading ? (
            <LoadingSpinner />
          ) : Array.isArray(latestNews) && latestNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestNews.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("home.news.emptyTitle")} description={t("home.news.emptyDesc")} />
          )}
        </div>
      </section>
    </div>
  );
}
