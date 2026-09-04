import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MoreHorizontal, Eye, Edit, Trash2, Globe, FileEdit } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccessBadge } from "./AccessBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import type { Archive } from "@/api/archives";

interface ArchiveTableProps {
  archives: Archive[];
  onView?: (archive: Archive) => void;
  onEdit?: (archive: Archive) => void;
  onPublish?: (archive: Archive) => void;
  onUnpublish?: (archive: Archive) => void;
  onDelete?: (archive: Archive) => void;
}

export function ArchiveTable({
  archives,
  onView,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
}: ArchiveTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.title")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("search.type")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("search.access")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("archive.detail.date")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("archiveTable.status")}</TableHead>
            <TableHead className="text-start">{t("dashboard.archives.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {archives.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted">
                {t("common.noData")}
              </TableCell>
            </TableRow>
          ) : (
            archives.map((archive) => (
              <TableRow key={archive.id}>
                <TableCell>
                  <div>
                    <Link
                      to={`/archives/${archive.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {archive.titleAr}
                    </Link>
                    {archive.titleEn && (
                      <p className="text-xs text-muted ltr">{archive.titleEn}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">
                    {t("materialTypes." + archive.materialType)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <AccessBadge level={archive.accessLevel} />
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted">
                  {archive.dateText ? formatDate(archive.dateText) : "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge
                    variant={
                      archive.status === "published"
                        ? "success"
                        : archive.status === "draft"
                        ? "warning"
                        : "secondary"
                    }
                  >
                    {t(`workflowStatuses.${archive.status}`, { defaultValue: archive.status })}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(archive)}>
                        <Eye className="ms-2 h-4 w-4" />
                        {t("dashboard.archives.view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(archive)}>
                        <Edit className="ms-2 h-4 w-4" />
                        {t("dashboard.archives.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {archive.status === "draft" && onPublish ? (
                        <DropdownMenuItem onClick={() => onPublish?.(archive)}>
                          <Globe className="ms-2 h-4 w-4" />
                          {t("dashboard.archives.submitReview")}
                        </DropdownMenuItem>
                      ) : archive.status === "published" && onUnpublish ? (
                        <DropdownMenuItem onClick={() => onUnpublish?.(archive)}>
                          <FileEdit className="ms-2 h-4 w-4" />
                          {t("dashboard.archives.unpublish")}
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete?.(archive)}
                        className="text-destructive"
                      >
                        <Trash2 className="ms-2 h-4 w-4" />
                        {t("dashboard.archives.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
