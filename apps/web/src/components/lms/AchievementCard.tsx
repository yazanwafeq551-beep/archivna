import { useTranslation } from "react-i18next";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { type UserAchievement } from "@/api/lms";

interface AchievementCardProps {
  achievement: UserAchievement;
  className?: string;
}

export function AchievementCard({ achievement, className }: AchievementCardProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const isUnlocked = !!achievement.earnedAt;
  const ach = achievement.achievement;

  const title = isRtl ? ach.titleAr : (ach.titleEn || ach.titleAr);
  const description = isRtl ? ach.descriptionAr : (ach.descriptionEn || ach.descriptionAr || "");

  return (
    <div
      className={cn(
        "group relative flex flex-col items-center rounded-xl border p-5 text-center transition-all duration-300",
        isUnlocked
          ? "border-gold/30 bg-gradient-to-b from-gold-light/20 to-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
          : "border-gray-200 bg-gray-50/50 opacity-60",
        className
      )}
    >
      <div
        className={cn(
          "mb-3 flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300",
          isUnlocked
            ? "bg-gradient-to-br from-gold to-amber-500 shadow-lg shadow-gold/20"
            : "bg-gray-200"
        )}
      >
        {isUnlocked ? (
          <Award className="h-8 w-8 text-white" />
        ) : (
          <Lock className="h-6 w-6 text-gray-400" />
        )}
      </div>

      <h4
        className={cn(
          "mb-1 text-sm font-semibold",
          isUnlocked ? "text-foreground" : "text-gray-400"
        )}
      >
        {title}
      </h4>

      {description && (
        <p
          className={cn(
            "mb-2 text-xs leading-relaxed",
            isUnlocked ? "text-muted" : "text-gray-300"
          )}
        >
          {description}
        </p>
      )}

      {isUnlocked && achievement.earnedAt && (
        <span className="mt-auto text-[10px] font-medium text-gold">
          {t("lms.achievements.earnedOn")} {new Date(achievement.earnedAt).toLocaleDateString()}
        </span>
      )}

      {!isUnlocked && (
        <span className="mt-auto text-[10px] text-gray-400">
          {t("lms.achievements.locked")}
        </span>
      )}
    </div>
  );
}
