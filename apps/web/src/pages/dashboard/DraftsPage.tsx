import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArchiveTable } from "@/components/archive/ArchiveTable";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDrafts, useDeleteArchive, usePublishArchive } from "@/hooks/useArchive";
import type { Archive } from "@/api/archives";

export function DraftsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Archive | null>(null);

  const { data, isLoading, error } = useDrafts({
    page,
    limit: 10,
    q: search || undefined,
  });

  const deleteMutation = useDeleteArchive();
  const publishMutation = usePublishArchive();

  const handleDelete = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id, {
        onSuccess: () => setDeleteTarget(null),
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        {t("dashboard.drafts.title")}
      </h2>

      <div className="relative max-w-md">
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

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
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
          title={t("empty.drafts")}
          description={t("empty.draftsDesc")}
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
