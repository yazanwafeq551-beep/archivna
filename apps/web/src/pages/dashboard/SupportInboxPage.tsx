import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, MessageSquareReply, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, ErrorState } from "@/components/shared";
import { supportApi, type SupportRequest } from "@/api/support";
import { getApiErrorMessage } from "@/lib/apiError";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const KIND_FILTERS = ["all", "consultation", "feedback", "suggestion", "complaint"] as const;

const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
  answered: "success",
  closed: "secondary",
  in_review: "warning",
  new: "warning",
};

/** Where the team answers what came in through sections 3 and 6. */
export function SupportInboxPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof KIND_FILTERS)[number]>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["support-inbox", filter],
    queryFn: () => supportApi.inbox(filter === "all" ? undefined : { kind: filter }),
  });

  const respond = useMutation({
    mutationFn: ({ id, response, status }: { id: string; response?: string; status?: SupportRequest["status"] }) =>
      supportApi.respond(id, { response, status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support-inbox"] });
      setDrafts((current) => ({ ...current, [variables.id]: "" }));
      toast.success(variables.response ? t("supportInbox.responded") : t("supportInbox.closed"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">
          {t("supportInbox.title")}
        </h2>
        <p className="mt-1 text-sm text-muted">{t("supportInbox.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {KIND_FILTERS.map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              filter === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted hover:bg-muted-bg"
            )}
          >
            {value === "all"
              ? t("supportInbox.all")
              : value === "consultation"
              ? t("sections.support.short")
              : t(`feedback.kinds.${value}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-muted-bg/60" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          title={t("supportInbox.empty")}
          description={t("supportInbox.emptyDesc")}
          icon={<Inbox className="h-9 w-9" strokeWidth={1.5} />}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{request.subject}</h3>
                      <Badge variant="secondary">
                        {request.kind === "consultation"
                          ? t("sections.support.short")
                          : t(`feedback.kinds.${request.kind}`)}
                      </Badge>
                      <Badge variant={statusVariant[request.status] ?? "secondary"}>
                        {t(`supportInbox.statuses.${request.status}`)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {t("supportInbox.from")}: {request.user?.fullName} · {request.user?.email} ·{" "}
                      {formatRelativeDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 whitespace-pre-line text-sm text-muted">{request.message}</p>

                {request.response && (
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                      <MessageSquareReply className="h-4 w-4" />
                      {t("support.response")}
                    </p>
                    <p className="whitespace-pre-line text-sm text-foreground">{request.response}</p>
                  </div>
                )}

                {request.status !== "closed" && (
                  <div className="mt-4 space-y-2">
                    <Textarea
                      placeholder={t("supportInbox.responsePlaceholder")}
                      value={drafts[request.id] ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({ ...current, [request.id]: event.target.value }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!drafts[request.id]?.trim() || respond.isPending}
                        onClick={() =>
                          respond.mutate({ id: request.id, response: drafts[request.id] })
                        }
                      >
                        <Send className="me-1 h-4 w-4" />
                        {t("supportInbox.sendResponse")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ id: request.id, status: "closed" })}
                      >
                        {t("supportInbox.close")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
