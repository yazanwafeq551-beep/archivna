import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, FileText, Image, Headphones, Video, Map, ScrollText, Users, Download, Building, Archive, BookOpen, ArrowUpLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArchiveCard } from "@/components/archive/ArchiveCard";
import { NewsCard } from "@/components/news/NewsCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLatestArchives, useFeaturedArchives, useArchiveStats } from "@/hooks/useArchive";
import { useAuth } from "@/hooks/useAuth";
import { canDeposit } from "@/lib/permissions";
import { useQuery } from "@tanstack/react-query";
import { newsApi } from "@/api/news";
import { MATERIAL_TYPES } from "@/lib/constants";
import { SectionDecoration } from "@/components/illustrations/SectionDecoration";
import { ArchivalPattern } from "@/components/illustrations/ArchivalPattern";

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-8 w-8" />,
  image: <Image className="h-8 w-8" />,
  audio: <Headphones className="h-8 w-8" />,
  video: <Video className="h-8 w-8" />,
  map: <Map className="h-8 w-8" />,
  manuscript: <ScrollText className="h-8 w-8" />,
};

const typeGradients: Record<string, string> = {
  document: "from-amber-50 to-amber-100",
  image: "from-blue-50 to-blue-100",
  audio: "from-purple-50 to-purple-100",
  video: "from-rose-50 to-rose-100",
  map: "from-emerald-50 to-emerald-100",
  manuscript: "from-orange-50 to-orange-100",
};

const typeColors: Record<string, string> = {
  document: "text-amber-600",
  image: "text-blue-600",
  audio: "text-purple-600",
  video: "text-rose-600",
  map: "text-emerald-600",
  manuscript: "text-orange-600",
};

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
  const { user, isAuthenticated } = useAuth();

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
          <div className={`animate-fade-in mx-auto max-w-2xl text-center lg:w-[52%] lg:text-start ${isArabic ? "lg:ml-auto lg:mr-0" : "lg:ml-0 lg:mr-auto"}`}>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/[.06] px-4 py-2 text-sm text-gold-light backdrop-blur-sm">
                <BookOpen className="h-4 w-4" />
                <span>{t("app.slogan")}</span>
              </div>
              <h1 className="mb-5 text-4xl font-bold leading-[1.12] text-white md:text-5xl lg:text-6xl">
                {t("home.hero.title")}
              </h1>
              <p className="mx-auto mb-8 max-w-xl text-base leading-8 text-white/70 md:text-lg lg:mx-0">
                {t("home.hero.description")}
              </p>
              <form onSubmit={handleSearch} className="mx-auto max-w-xl lg:mx-0">
                <div className="relative rounded-2xl bg-surface p-1.5 shadow-[0_24px_60px_rgba(0,0,0,.22)]">
                  <Input
                    type="search"
                    placeholder={t("home.hero.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 border-0 bg-transparent pe-14 text-base shadow-none focus-visible:ring-0"
                    dir="auto"
                    icon={<Search className="h-5 w-5 text-muted" />}
                  />
                  <button type="submit" className="absolute end-2 top-2 grid h-13 w-13 place-items-center rounded-xl bg-gold text-primary-dark transition-colors hover:bg-gold-deep hover:text-white" aria-label={t("nav.search")}>
                    <ArrowUpLeft className="h-5 w-5" />
                  </button>
                </div>
              </form>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                {/* Depositing needs a role, so visitors are invited to join
                    instead of being sent to a page that refuses them. */}
                {!isAuthenticated ? (
                  <Button asChild variant="gold">
                    <Link to="/register">{t("nav.register")}</Link>
                  </Button>
                ) : (
                  canDeposit(user) && (
                    <Button asChild variant="gold">
                      <Link to="/dashboard/archives/new">
                        {t("home.hero.addButton")}
                      </Link>
                    </Button>
                  )
                )}
                <Button variant="outline" asChild className="border-white/20 bg-white/[.06] text-white hover:border-gold/50 hover:bg-white/10 hover:text-white">
                  <Link to="/search">{t("nav.search")}</Link>
                </Button>
              </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/40" />
      </section>

      {/* Browse by Type */}
      <section className="relative py-16 md:py-20">
        <div className="container-app">
          <div className="mb-10 text-center">
            <SectionDecoration className="mb-4" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
              {t("home.browse.title")}
            </h2>
            <p className="mt-2 text-muted max-w-lg mx-auto">{t("home.browse.subtitle")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MATERIAL_TYPES.map((type) => (
              <Link key={type.value} to={`/search?type=${type.value}`}>
                <Card className="hover-card text-center p-6 h-full group border-0 bg-gradient-to-br from-white to-muted-bg/30 shadow-sm hover:shadow-md">
                  <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${typeGradients[type.value]} group-hover:scale-110 transition-transform duration-300`}>
                    <div className={typeColors[type.value]}>
                      {typeIcons[type.value]}
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {t("materialTypes." + type.value)}
                  </h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
          ) : latestArchives && latestArchives.length > 0 ? (
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
          ) : featuredArchives && featuredArchives.length > 0 ? (
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
          ) : latestNews && latestNews.length > 0 ? (
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
