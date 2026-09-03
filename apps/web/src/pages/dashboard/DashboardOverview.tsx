import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { FolderOpen, FileEdit, Globe, HardDrive, Plus, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared";
import { useQuery } from "@tanstack/react-query";
import { archivesApi } from "@/api/archives";
import { useMyArchives } from "@/hooks/useArchive";
import { formatFileSize, formatDate } from "@/lib/utils";

export function DashboardOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => archivesApi.getStats(),
  });

  const { data: recentData, isLoading: recentLoading, isError: recentError, refetch: refetchRecent } = useMyArchives({
    page: 1,
    limit: 5,
    sort: "newest",
  });

  const cards = [
    {
      title: t("dashboard.overview.totalArchives"),
      value: stats?.totalRecords || 0,
      sub: t("dashboard.overview.publicArchives"),
      icon: <FolderOpen className="h-5 w-5 text-primary" />,
      bgClass: "bg-primary/10",
    },
    {
      title: t("dashboard.overview.myArchives"),
      value: stats?.myArchives || 0,
      sub: `${stats?.myPublished || 0} ${t("dashboard.overview.published").toLowerCase()} / ${stats?.myDrafts || 0} ${t("dashboard.overview.drafts").toLowerCase()}`,
      icon: <FileEdit className="h-5 w-5 text-amber-600" />,
      bgClass: "bg-amber-50",
    },
    {
      title: t("dashboard.overview.storage"),
      value: stats?.storageUsed ? formatFileSize(stats.storageUsed) : "0 MB",
      sub: t("dashboard.overview.totalFiles"),
      icon: <HardDrive className="h-5 w-5 text-blue-600" />,
      bgClass: "bg-blue-50",
    },
    {
      title: t("dashboard.overview.institutions"),
      value: stats?.totalInstitutions || 0,
      sub: t("dashboard.overview.registeredInstitutions"),
      icon: <Globe className="h-5 w-5 text-green-600" />,
      bgClass: "bg-green-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {t("dashboard.overview.title")}
        </h2>
        <Button onClick={() => navigate("/dashboard/archives/new")}>
          <Plus className="ms-1 h-4 w-4" />
          {t("dashboard.archives.new")}
        </Button>
      </div>

      {statsError ? (
        <ErrorState
          title={t("common.error")}
          message={t("dashboard.overview.error")}
          onRetry={() => refetchStats()}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-muted truncate">{card.title}</p>
                    {statsLoading ? (
                      <Skeleton className="mt-1 h-8 w-20" />
                    ) : (
                      <>
                        <p className="mt-1 text-2xl font-bold text-foreground">
                          {typeof card.value === "number" ? card.value.toLocaleString(i18n.language) : card.value}
                        </p>
                        {card.sub && (
                          <p className="mt-0.5 text-xs text-muted truncate">{card.sub}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className={`rounded-lg p-3 shrink-0 ${card.bgClass}`}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted" />
              {t("dashboard.overview.recentActivity")}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/archives")}>
              {t("common.viewAll")}
              <ArrowLeft className="me-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentError ? (
              <ErrorState
                title={t("common.error")}
                onRetry={() => refetchRecent()}
              />
            ) : recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentData && recentData.data.length > 0 ? (
              <ul className="space-y-2">
                {recentData.data.map((archive) => (
                  <li key={archive.id}>
                    <button
                      onClick={() => navigate(`/archives/${archive.id}`)}
                      className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-muted-bg transition-colors text-start"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {archive.titleAr}
                        </p>
                        <p className="text-xs text-muted">
                          {formatDate(archive.createdAt)}
                        </p>
                      </div>
                      <Badge variant={archive.status === "published" ? "default" : "secondary"}>
                        {archive.status === "published" ? t("common.published") : t("common.draft")}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted text-sm">{t("empty.recentActivity")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate("/dashboard/archives/new")}
                >
                  <Plus className="ms-1 h-4 w-4" />
                  {t("dashboard.archives.new")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.overview.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-1"
                onClick={() => navigate("/dashboard/archives/new")}
              >
                <Plus className="h-6 w-6 text-primary" />
                <span className="text-sm">{t("dashboard.overview.newArchive")}</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-1"
                onClick={() => navigate("/dashboard/drafts")}
              >
                <FileEdit className="h-6 w-6 text-amber-600" />
                <span className="text-sm">{t("dashboard.overview.viewDrafts")}</span>
                {stats && stats.myDrafts > 0 && (
                  <Badge variant="secondary" className="mt-1">{stats.myDrafts}</Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-1"
                onClick={() => navigate("/dashboard/published")}
              >
                <Globe className="h-6 w-6 text-green-600" />
                <span className="text-sm">{t("dashboard.overview.viewPublished")}</span>
                {stats && stats.myPublished > 0 && (
                  <Badge variant="secondary" className="mt-1">{stats.myPublished}</Badge>
                )}
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-1"
                onClick={() => navigate("/dashboard/favorites")}
              >
                <FolderOpen className="h-6 w-6 text-blue-600" />
                <span className="text-sm">{t("dashboard.overview.viewFavorites")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
