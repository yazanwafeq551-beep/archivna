import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, User } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, truncateText } from "@/lib/utils";
import type { NewsArticle } from "@/api/news";

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover-card overflow-hidden h-full flex flex-col">
      {article.coverImagePath && (
        <div className="h-48 overflow-hidden">
          <img
            src={article.coverImagePath}
            alt={article.titleAr}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <CardContent className="flex-1 p-4">
        <h3 className="mb-2 font-semibold text-foreground line-clamp-2">
          <Link to={`/news/${article.slug}`} className="hover:text-primary transition-colors">
            {article.titleAr}
          </Link>
        </h3>
        <p className="text-sm text-muted line-clamp-3">
          {truncateText(article.excerptAr || article.contentAr.slice(0, 150), 150)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {article.category?.nameAr || article.status}
          </span>
          {article.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.publishedAt)}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/news/${article.slug}`}>
            {t("news.readMore")}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
