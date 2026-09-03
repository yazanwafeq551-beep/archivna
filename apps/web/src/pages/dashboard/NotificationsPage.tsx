import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi, type Notification } from "@/api/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Bell, Check, CheckCheck } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";

export function NotificationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getAll(1, 50),
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      toast.success(t("dashboard.notifications.markAllReadSuccess"));
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState onRetry={() => window.location.reload()} />;

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.unreadCount || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {t("dashboard.notifications.title")}
        </h2>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="ms-1 h-4 w-4" />
            {t("dashboard.notifications.markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          title={t("empty.notifications")}
          description={t("empty.notificationsDesc")}
          icon={<Bell className="h-12 w-12 text-muted" />}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                !notification.read ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`rounded-full p-2 ${
                  notification.type === "success" ? "bg-green-100" :
                  notification.type === "error" ? "bg-red-100" :
                  notification.type === "warning" ? "bg-amber-100" :
                  "bg-blue-100"
                }`}>
                  <Bell className={`h-4 w-4 ${
                    notification.type === "success" ? "text-green-600" :
                    notification.type === "error" ? "text-red-600" :
                    notification.type === "warning" ? "text-amber-600" :
                    "text-blue-600"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{notification.title}</p>
                  <p className="text-sm text-muted mt-0.5">{notification.message}</p>
                  <p className="text-xs text-muted mt-1">{formatRelativeDate(notification.createdAt)}</p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => markAsRead.mutate(notification.id)}
                    title={t("dashboard.notifications.markAsRead")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
