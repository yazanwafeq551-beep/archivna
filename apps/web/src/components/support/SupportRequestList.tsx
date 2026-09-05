import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, MessageSquareReply } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import type { SupportRequest } from "@/api/support";

const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
  answered: "success",
  closed: "secondary",
  in_review: "warning",
  new: "warning",
};

/** The trail of what somebody sent in and what came back. */
export function SupportRequestList({ requests }: { requests: SupportRequest[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground">{request.subject}</h3>
                <p className="mt-1 text-xs text-muted">
                  {formatRelativeDate(request.createdAt)}
                  {request.topic ? ` · ${t(`support.topics.${request.topic}`, { defaultValue: request.topic })}` : ""}
                </p>
              </div>
              <Badge variant={statusVariant[request.status] ?? "secondary"}>
                {t(`supportInbox.statuses.${request.status}`)}
              </Badge>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm text-muted">{request.message}</p>

            {request.response ? (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
                  <MessageSquareReply className="h-4 w-4" />
                  {t("support.response")}
                  {request.responder ? ` · ${request.responder.fullName}` : ""}
                </p>
                <p className="whitespace-pre-line text-sm text-foreground">{request.response}</p>
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                {request.status === "closed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {t("support.awaiting")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
