import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search, Clock, Users, Star, BookOpen, BarChart3, ArrowRight,
  GraduationCap, Library, ScrollText, FileText, Video,
  BookMarked, Filter, ChevronDown, Sparkles, PlayCircle
} from "lucide-react";
import { useCourses, useCategories, useLmsStats } from "@/hooks/useLms";
import { useAuth } from "@/hooks/useAuth";
import { CourseCard } from "@/components/lms/CourseCard";
import { GuestModal } from "@/components/lms/GuestModal";
import { LoadingSpinner, ErrorState, EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-5 w-5" />,
  image: <FileText className="h-5 w-5" />,
  video: <Video className="h-5 w-5" />,
  manuscript: <ScrollText className="h-5 w-5" />,
  default: <BookOpen className="h-5 w-5" />,
};

export function CoursesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const coursesRef = useRef<HTMLDivElement>(null);

  const { data: coursesData, isLoading: coursesLoading, isError: coursesError, refetch: refetchCourses } = useCourses({
    page: currentPage,
    limit: 12,
    ...(selectedCategory !== "all" && { category: selectedCategory }),
    ...(selectedDifficulty !== "all" && { difficulty: selectedDifficulty }),
    ...(searchQuery && { q: searchQuery }),
    sort: sortBy,
  });

  const { data: categories } = useCategories();
  const { data: stats } = useLmsStats();

  const courses = coursesData?.data ?? [];
  const totalPages = coursesData?.meta?.totalPages ?? 1;
  const totalCourses = coursesData?.meta?.total ?? 0;

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    coursesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleStartLearning = () => {
    if (!isAuthenticated) {
      setShowGuestModal(true);
      return;
    }
    navigate("/lms/dashboard");
  };

  const handleFilterChange = (setter: (val: string) => void) => (val: string) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary-dark">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5L55 30L30 55L5 30Z' fill='none' stroke='%23C6A15B' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }} />
        <div className="absolute top-0 end-0 h-96 w-96 translate-x-1/3 -translate-y-1/3 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-0 start-0 h-64 w-64 -translate-x-1/4 translate-y-1/4 rounded-full bg-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/10 px-4 py-1.5 text-sm text-gold backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              {t("lms.hero.badge")}
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("lms.hero.title")}
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-white/70">
              {t("lms.hero.subtitle")}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="xl"
                variant="gold"
                className="min-w-[200px] text-base font-semibold shadow-xl shadow-gold/20 hover:shadow-gold/30"
                onClick={handleStartLearning}
              >
                <PlayCircle className="me-2 h-5 w-5" />
                {t("lms.hero.startLearning")}
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="min-w-[200px] border-white/20 bg-white/10 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                onClick={() => coursesRef.current?.scrollIntoView({ behavior: "smooth" })}
              >
                <BookOpen className="me-2 h-5 w-5" />
                {t("lms.hero.browseCourses")}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: BookOpen, value: stats?.totalCourses ?? 0, label: "lms.hero.stats.courses" },
              { icon: Clock, value: stats?.totalLearningHours ?? 0, label: "lms.hero.stats.hours" },
              { icon: Users, value: stats?.totalEnrollments ?? 0, label: "lms.hero.stats.learners" },
              { icon: Library, value: stats?.totalLessons ?? 0, label: "lms.hero.stats.resources" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
                >
                  <Icon className="mb-2 h-6 w-6 text-gold" />
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-white/60">{t(stat.label)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-gold-light/30 bg-white/50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryClick("all")}
              className={cn(
                "flex-shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-all",
                selectedCategory === "all"
                  ? "border-primary bg-primary text-white shadow-md"
                  : "border-gold-light/40 bg-white text-foreground hover:border-gold/30 hover:shadow-sm"
              )}
            >
              {t("lms.categories.all")}
            </button>
            {categories?.map((cat) => {
              const isActive = selectedCategory === cat.slug;
              const name = i18n.language === "ar" ? cat.nameAr : (cat.nameEn || cat.nameAr);
              const count = cat._count?.courses;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={cn(
                    "flex-shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "border-primary bg-primary text-white shadow-md"
                      : "border-gold-light/40 bg-white text-foreground hover:border-gold/30 hover:shadow-sm"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {categoryIcons[cat.slug] || categoryIcons.default}
                    {name}
                    {count !== undefined && (
                      <span className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px]",
                        isActive ? "bg-white/20 text-white" : "bg-gold-light/40 text-muted"
                      )}>
                        {count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Course Listing */}
      <section ref={coursesRef} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                type="text"
                placeholder={t("lms.courses.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 border-gold-light/40 bg-white"
              />
            </form>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedDifficulty} onValueChange={handleFilterChange(setSelectedDifficulty)}>
                <SelectTrigger className="w-[140px] border-gold-light/40 bg-white">
                  <SelectValue placeholder={t("lms.courses.allDifficulties")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("lms.courses.allDifficulties")}</SelectItem>
                  <SelectItem value="beginner">{t("lms.difficulty.beginner")}</SelectItem>
                  <SelectItem value="intermediate">{t("lms.difficulty.intermediate")}</SelectItem>
                  <SelectItem value="advanced">{t("lms.difficulty.advanced")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={handleFilterChange(setSortBy)}>
                <SelectTrigger className="w-[160px] border-gold-light/40 bg-white">
                  <SelectValue placeholder={t("lms.courses.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{t("lms.courses.sortOptions.newest")}</SelectItem>
                  <SelectItem value="popular">{t("lms.courses.sortOptions.popular")}</SelectItem>
                  <SelectItem value="oldest">{t("lms.courses.sortOptions.oldest")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content */}
        {coursesLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gold-light/30 bg-white p-4">
                <div className="mb-4 aspect-video rounded-lg bg-gold-light/30" />
                <div className="mb-2 h-5 w-3/4 rounded bg-gold-light/30" />
                <div className="mb-3 h-4 w-full rounded bg-gold-light/20" />
                <div className="mb-3 h-4 w-1/2 rounded bg-gold-light/20" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded-full bg-gold-light/30" />
                  <div className="h-6 w-16 rounded-full bg-gold-light/30" />
                </div>
              </div>
            ))}
          </div>
        ) : coursesError ? (
          <ErrorState
            title={t("lms.courses.errorTitle")}
            message={t("lms.courses.errorMessage")}
            onRetry={() => refetchCourses()}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            title={t("lms.courses.emptyTitle")}
            description={t("lms.courses.emptyDescription")}
            icon={<BookOpen className="h-12 w-12 text-muted" />}
          />
        ) : (
          <>
            <div className="mb-2 text-sm text-muted">
              {t("lms.courses.showing")} <span className="font-medium text-foreground">{totalCourses}</span> {t("lms.courses.results")}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${(index % 4) * 100}ms` }}
                >
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </section>

      <GuestModal open={showGuestModal} onOpenChange={setShowGuestModal} />
    </div>
  );
}
