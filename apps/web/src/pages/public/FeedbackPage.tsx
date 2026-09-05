import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared";
import { SupportRequestList } from "@/components/support/SupportRequestList";
import { SectionHero } from "@/components/layout/SectionHero";
import { supportApi, type SupportKind } from "@/api/support";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";

const KINDS: SupportKind[] = ["feedback", "suggestion", "complaint"];

/** Section 6: notes, suggestions and complaints. */
export function FeedbackPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<SupportKind>("feedback");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: submissions = [] } = useQuery({
    queryKey: ["support-requests", "feedback"],
    queryFn: () => supportApi.mine(KINDS),
    enabled: isAuthenticated,
  });

  const send = useMutation({
    mutationFn: () => supportApi.create({ kind, subject, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-requests"] });
      setSubject("");
      setMessage("");
      toast.success(t("feedback.sent"));
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send.mutate();
  };

  return (
    <div>
      <SectionHero
        number={6}
        icon={<ClipboardList className="h-7 w-7" />}
        title={t("feedback.title")}
        description={t("feedback.subtitle")}
      />

      <div className="container-app grid gap-8 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("feedback.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="mb-2 block text-sm font-medium text-foreground">
                    {t("feedback.kind")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {KINDS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setKind(value)}
                        className={cn(
                          "rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                          kind === value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted hover:bg-muted-bg"
                        )}
                      >
                        {t(`feedback.kinds.${value}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label={t("feedback.subject")}
                  placeholder={t("feedback.subjectPlaceholder")}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  minLength={3}
                />

                <Textarea
                  label={t("feedback.message")}
                  placeholder={t("feedback.messagePlaceholder")}
                  className="min-h-36"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  minLength={10}
                />

                <Button type="submit" isLoading={send.isPending}>
                  <Send className="me-1 h-4 w-4" />
                  {t("feedback.send")}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <EmptyState
                  title={t("support.loginTitle")}
                  description={t("support.loginDesc")}
                  icon={<ClipboardList className="h-9 w-9" strokeWidth={1.5} />}
                />
                <div className="flex gap-2">
                  <Button asChild>
                    <Link to="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/register">{t("nav.register")}</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t("feedback.mySubmissions")}
          </h2>
          {submissions.length > 0 ? (
            <SupportRequestList requests={submissions} />
          ) : (
            <EmptyState title={t("feedback.empty")} description={t("feedback.emptyDesc")} />
          )}
        </div>
      </div>
    </div>
  );
}
