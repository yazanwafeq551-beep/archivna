import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1" aria-label={t("common.pagination")}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t("common.previousPage")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {getPageNumbers().map((page, index) => (
        <React.Fragment key={index}>
          {page === "..." ? (
            <span className="flex h-10 w-10 items-center justify-center">
              <MoreHorizontal className="h-4 w-4 text-muted" />
            </span>
          ) : (
            <Button
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              onClick={() => onPageChange(page as number)}
              aria-label={t("common.page", { page })}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t("common.nextPage")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </nav>
  );
}

export { Pagination };
