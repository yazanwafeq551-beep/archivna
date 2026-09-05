import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Headphones, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared";
import { SupportRequestList } from "@/components/support/SupportRequestList";
import { SectionHero } from "@/components/layout/SectionHero";
import { supportApi } from "@/api/support";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/apiError";

const TOPICS = [
  "cataloging",
  "preservation",
  "rights",
  "institutional",
  "platform",
  "other",
] as const;

/** Section 3: knowledge support from the Arsheefna team. */
export function SupportPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [topic, setTopic] = useState<string>("cataloging");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: requests = [] } = useQuery({
    queryKey: ["support-requests", "consultation"],
    queryFn: () => supportApi.mine("consultation"),
    enabled: isAuthenticated,
  });

  const send = useMutation({
    mutationFn: () =>
      supportApi.create({ kind: "consultation", topic, subject, message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-requests"] });
      setSubject("");
      setMessage("");
      toast.success(t("support.sent"));
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
        number={3}
        icon={<Headphones className="h-7 w-7" />}
        title={t("support.title")}
        description={t("support.subtitle")}
      />

      <div className="container-app grid gap-8 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("support.formTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isAuthenticated ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    {t("support.topic")}
                  </label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("support.selectTopic")} />
                    </SelectTrigger>
                    <SelectContent>
                      {TOPICS.map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`support.topics.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  label={t("support.subject")}
                  placeholder={t("support.subjectPlaceholder")}
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                  minLength={3}
                />

                <Textarea
                  label={t("support.message")}
                  placeholder={t("support.messagePlaceholder")}
                  className="min-h-36"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  required
                  minLength={10}
                />

                <Button type="submit" isLoading={send.isPending}>
                  <Send className="me-1 h-4 w-4" />
                  {t("support.send")}
                </Button>
              </form>
            ) : (
              <EmptyState
                title={t("support.loginTitle")}
                description={t("support.loginDesc")}
                icon={<Headphones className="h-9 w-9" strokeWidth={1.5} />}
                action={{ label: t("nav.login"), onClick: () => undefined }}
              />
            )}

            {!isAuthenticated && (
              <div className="mt-4 flex gap-2">
                <Button asChild>
                  <Link to="/login">{t("nav.login")}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/register">{t("nav.register")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            {t("support.myRequests")}
          </h2>
          {requests.length > 0 ? (
            <SupportRequestList requests={requests} />
          ) : (
            <EmptyState title={t("support.empty")} description={t("support.emptyDesc")} />
          )}
        </div>
      </div>
    </div>
  );
}
