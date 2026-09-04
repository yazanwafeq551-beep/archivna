import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { useAchievements } from "@/hooks/useLms";
import { AchievementCard } from "@/components/lms/AchievementCard";
import { ErrorState, EmptyState } from "@/components/shared";

export function AchievementsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useAchievements();

  if (isLoading) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 rounded-xl bg-gold-light/30" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t("lms.dashboard.errorTitle")}
        message={t("lms.dashboard.errorMessage")}
        onRetry={() => refetch()}
      />
    );
  }

  const achievements = data ?? [];

  if (achievements.length === 0) {
    return (
      <EmptyState
        title={t("lms.achievements.noAchievements")}
        description={t("lms.achievements.keepLearning")}
        icon={<Award className="h-9 w-9" strokeWidth={1.5} />}
        action={{
          label: t("lms.dashboard.browseCourses"),
          onClick: () => navigate("/lms"),
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("lms.achievements.title")}</h1>
        <p className="text-sm text-muted">{t("lms.achievements.earned")}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.achievementId} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
