import { useTranslation } from "react-i18next";
import { FileText, Download, ExternalLink, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LessonAttachment } from "@/api/lms";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface LessonContentProps {
  content: string;
  attachments?: LessonAttachment[];
  className?: string;
}

export function LessonContent({ content, attachments, className }: LessonContentProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  const resourceAttachments = attachments?.filter((a) => a.type === "resource") ?? [];
  const referenceAttachments = attachments?.filter((a) => a.type === "reference") ?? [];
  const externalLinks = attachments?.filter((a) => a.type === "link") ?? [];

  return (
    <div className={cn("space-y-8", className)} dir={isRtl ? "rtl" : "ltr"}>
      {content && (
        <div
          className="prose prose-sm max-w-none text-foreground/80 prose-headings:text-foreground prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
        />
      )}

      {resourceAttachments.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4 text-gold" />
            {t("lms.lesson.attachments")}
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {resourceAttachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-gold-light/30 bg-surface p-3 text-sm transition-all hover:border-gold/30 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-light/30 text-gold">
                  <Download className="h-4 w-4" />
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate font-medium text-foreground">
                    {isRtl ? attachment.titleAr : (attachment.titleEn || attachment.titleAr)}
                  </p>
                  {attachment.fileSize && (
                    <p className="text-xs text-muted">{formatFileSize(attachment.fileSize)}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {referenceAttachments.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <LinkIcon className="h-4 w-4 text-gold" />
            {t("lms.lesson.references")}
          </h3>
          <ul className="space-y-2">
            {referenceAttachments.map((ref) => (
              <li key={ref.id}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gold hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {isRtl ? ref.titleAr : (ref.titleEn || ref.titleAr)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {externalLinks.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ExternalLink className="h-4 w-4 text-gold" />
            {t("lms.lesson.externalLinks")}
          </h3>
          <ul className="space-y-2">
            {externalLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-gold hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    {isRtl ? link.titleAr : (link.titleEn || link.titleAr)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
