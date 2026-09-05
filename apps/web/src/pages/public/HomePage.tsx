import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Users, Download, Building, Archive, BookOpen, ArrowUpLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { NewsCard } from "@/components/news/NewsCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLatestArchives, useFeaturedArchives, useArchiveStats } from "@/hooks/useArchive";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/api/news";
import { MATERIAL_TYPES } from "@/lib/constants";
import { PlatformServices } from "@/components/home/PlatformServices";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";
import { ArchivalPattern } from "@/components/illustrations/ArchivalPattern";

const statIcons: Record<string, React.ReactNode> = {
  totalRecords: <Archive className="h-8 w-8" />,
  totalUsers: <Users className="h-8 w-8" />,
  totalDownloads: <Download className="h-8 w-8" />,
  totalInstitutions: <Building className="h-8 w-8" />,
};

export function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const isArabic = i18n.language.startsWith("ar");

  const { data: latestArchives, isLoading: latestLoading, error: latestError } = useLatestArchives(6);
  const { data: featuredArchives, isLoading: featuredLoading, error: featuredError } = useFeaturedArchives(4);
  const { data: stats, isLoading: statsLoading } = useArchiveStats();
  const { data: latestNews, isLoading: newsLoading } = useQuery({
    queryKey: ["latestNews"],
    queryFn: () => newsApi.getLatest(3),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative flex min-h-[650px] items-center overflow-hidden bg-primary-dark py-16 md:min-h-[700px] lg:py-20">
        {/*
          The hero is the largest asset on the site: served as WebP at the size
          the viewport actually needs, with a JPEG fallback.
        */}
        <picture>
          <source
            type="image/webp"
            srcSet="/images/arsheefna-heritage-hero-v3-800.webp 800w, /images/arsheefna-heritage-hero-v3-1200.webp 1200w, /images/arsheefna-heritage-hero-v3.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/images/arsheefna-heritage-hero-v3.jpg"
            alt=""
            width={1774}
            height={887}
            fetchPriority="high"
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover object-[32%_center] ${isArabic ? "" : "-scale-x-100"}`}
          />
        </picture>
        <div className="absolute inset-0 bg-primary-dark/65 lg:bg-transparent" />
        <div className={`absolute inset-0 hidden lg:block ${isArabic ? "bg-gradient-to-l from-primary-dark via-primary-dark/95 to-primary-dark/5" : "bg-gradient-to-r from-primary-dark via-primary-dark/95 to-primary-dark/5"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/70 via-transparent to-primary-dark/15" />
        <div className="container-app relative z-10 w-full">
          <div
            className={`animate-fade-in mx-auto max-w-2xl text-center lg:w-[56%] lg:text-start ${
              isArabic ? "lg:ml-auto lg:mr-0" : "lg:ml-0 lg:mr-auto"
            }`}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/[.06] px-4 py-1.5 text-xs font-semibold text-gold-light backdrop-blur-sm">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{t("app.slogan")}</span>
            </div>

            <h1 className="mb-4 font-heading text-4xl font-bold leading-[1.15] text-white md:text-5xl lg:text-[3.4rem]">
              {t("home.hero.title")}
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-base leading-8 text-white/75 lg:mx-0">
              {t("home.hero.description")}
            </p>

            <form onSubmit={handleSearch} className="mx-auto max-w-xl lg:mx-0">
              <div className="relative rounded-2xl bg-surface p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.28)]">
                <Input
                  type="search"
                  placeholder={t("home.hero.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 border-0 bg-transparent pe-14 text-base shadow-none focus-visible:ring-0"
                  dir="auto"
                  icon={<Search className="h-5 w-5 text-muted" />}
                />
                <button
                  type="submit"
                  className="absolute end-2 top-2 grid h-11 w-11 place-items-center rounded-xl bg-gold text-primary-dark transition-colors hover:bg-gold-deep hover:text-white"
                  aria-label={t("nav.search")}
                >
                  <ArrowUpLeft className="h-5 w-5" />
                </button>
              </div>
            </form>

            {/* Straight into the material types, so the search box is not the only way in. */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="text-xs text-white/50">{t("home.browse.title")}:</span>
              {MATERIAL_TYPES.map((type) => (
                <Link
                  key={type.value}
                  to={`/search?type=${type.value}`}
                  className="rounded-full border border-white/15 bg-white/[.06] px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-gold/50 hover:text-white"
                >
                  {t("materialTypes." + type.value)}
                </Link>
              ))}
            </div>

            {/* What the archive holds right now, rather than a wall of buttons. */}
            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3 lg:mx-0">
              {[
                { value: stats?.totalRecords, label: t("home.stats.totalRecords") },
                { value: stats?.totalInstitutions, label: t("home.stats.totalInstitutions") },
                { value: stats?.totalUsers, label: t("home.stats.totalUsers") },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-center backdrop-blur-sm lg:text-start"
                >
                  <dt className="text-[11px] text-white/60">{item.label}</dt>
                  <dd className="mt-0.5 font-heading text-2xl font-bold text-gold-light">
                    {statsLoading ? "—" : item.value ?? 0}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/40" />
      </section>

      {/* The platform's seven services, straight under the hero. */}
      <PlatformServices />

      {/* Latest Archives */}
      <section className="py-12 md:py-16 bg-muted-bg/50 relative">
        <ArchivalPattern variant="dots" className="absolute inset-0 w-full h-full" />
        <div className="container-app relative z-10">
          <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                {t("home.latest.title")}
              </h2>
              <p className="mt-1 text-muted">{t("home.latest.subtitle")}</p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link to="/search">{t("home.latest.viewAll")}</Link>
            </Button>
          </div>
          {latestLoading ? (
            <LoadingSpinner />
          ) : latestError ? (
            <ErrorState onRetry={() => window.location.reload()} />
          ) : Array.isArray(latestArchives) && latestArchives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestArchives.map((archive) => (
                <ArchiveCard key={archive.id} archive={archive} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("home.latest.emptyTitle")} description={t("home.latest.emptyDesc")} />
          )}
        </div>
      </section>

      {/* Featured Archives */}
      <section className="py-12 md:py-16">
        <div className="container-app">
          <div className="mb-10 text-center">
            <SectionDecoration className="mb-4" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              {t("home.featured.title")}
            </h2>
            <p className="mt-2 text-muted max-w-lg mx-auto">{t("home.featured.subtitle")}</p>
          </div>
          {featuredLoading ? (
            <LoadingSpinner />
          ) : featuredError ? (
            <ErrorState onRetry={() => window.location.reload()} />
          ) : Array.isArray(featuredArchives) && featuredArchives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredArchives.map((archive) => (
                <ArchiveCard key={archive.id} archive={archive} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("home.featured.emptyTitle")} description={t("home.featured.emptyDesc")} />
          )}
        </div>
      </section>

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

      {/* About Section */}
      <section className="py-12 md:py-16 bg-muted-bg/50 relative overflow-hidden">
        <ArchivalPattern variant="diamond" className="absolute inset-0 w-full h-full" />
        <div className="container-app relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <SectionDecoration className="mb-4" />
            <h2 className="mb-4 text-2xl md:text-3xl font-heading font-bold text-foreground">
              {t("home.about.title")}
            </h2>
            <p className="text-lg text-muted leading-relaxed">
              {t("home.about.description")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link to="/about">{t("nav.about")}</Link>
              </Button>
              <Button variant="outline" asChild>
                <a href="mailto:info@arsheefna.ps">{t("footer.contact")}</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
