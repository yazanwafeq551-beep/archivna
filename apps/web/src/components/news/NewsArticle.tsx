import { useTranslation } from "react-i18next";
import { Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";
import type { NewsArticle as NewsArticleType } from "@/api/news";

interface NewsArticleProps {
  article: NewsArticleType;
}

export function NewsArticle({ article }: NewsArticleProps) {
  return (
    <article className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground/80">
      <h1>{article.titleAr}</h1>
      <div className="flex items-center gap-4 text-sm text-muted not-prose mb-8">
        {article.category && (
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {article.category.nameAr}
          </span>
        )}
        {article.publishedAt && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(article.publishedAt)}
          </span>
        )}
      </div>
      {article.coverImagePath && (
        <img
          src={article.coverImagePath}
          alt={article.titleAr}
          className="w-full rounded-lg mb-8"
        />
      )}
      <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.contentAr) }} />
    </article>
  );
}
