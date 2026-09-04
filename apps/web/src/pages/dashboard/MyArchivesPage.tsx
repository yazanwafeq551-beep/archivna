import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArchiveTable } from "@/components/archive/ArchiveTable";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useMyArchives, useDeleteArchive, usePublishArchive, useUnpublishArchive } from "@/hooks/useArchive";
import type { Archive } from "@/api/archives";
import { useAuth } from "@/hooks/useAuth";

export function MyArchivesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Archive | null>(null);
  const { user } = useAuth();
  const canDeposit = user?.roleAssignments?.some((assignment) => ["system_admin", "institution_admin", "depositor", "cataloger"].includes(assignment.role));
  const canUnpublish = user?.roleAssignments?.some((assignment) => ["system_admin", "institution_admin"].includes(assignment.role));

  const { data, isLoading, error } = useMyArchives({
    page,
    limit: 10,
    q: search || undefined,
  });

  const deleteMutation = useDeleteArchive();
  const publishMutation = usePublishArchive();
  const unpublishMutation = useUnpublishArchive();

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {t("dashboard.archives.title")}
        </h2>
        {canDeposit && <Button onClick={() => navigate("/dashboard/archives/new")}>
          <Plus className="ms-1 h-4 w-4" />
          {t("dashboard.archives.new")}
        </Button>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder={t("dashboard.archives.search")}
            className="ps-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => window.location.reload()} />
      ) : data && data.data.length > 0 ? (
        <>
          <ArchiveTable
            archives={data.data}
            onView={(a) => navigate(`/archives/${a.id}`)}
            onEdit={(a) => navigate(`/dashboard/archives/${a.id}/edit`)}
            onPublish={(a) => publishMutation.mutate(a.id)}
            onUnpublish={canUnpublish ? (a) => unpublishMutation.mutate(a.id) : undefined}
            onDelete={setDeleteTarget}
          />
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
          title={t("empty.myArchives")}
          description={t("empty.myArchivesDesc")}
          action={canDeposit ? {
            label: t("dashboard.archives.new"),
            onClick: () => navigate("/dashboard/archives/new"),
          } : undefined}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("dashboard.archives.delete")}
        description={t("dashboard.archives.confirmDelete")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
