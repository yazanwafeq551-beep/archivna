import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

const forgotSchema = z.object({
  email: z.string().email(i18n.t("validation.invalidEmail")),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | undefined>();

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      const result = await authApi.forgotPassword(data.email);
      setResetToken(result.resetToken);
      setIsSubmitted(true);
      toast.success(t("auth.forgotPassword.success"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo variant="icon" size="lg" />
          </div>
          <CardTitle className="text-xl">{t("auth.forgotPassword.title")}</CardTitle>
          <CardDescription>{t("auth.forgotPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted">
                {t("auth.forgotPassword.success")}
              </p>
              {resetToken && import.meta.env.DEV && (
                <div className="rounded-md bg-muted p-3 text-start">
                  <p className="text-xs font-medium text-muted mb-1">
                    {t("auth.forgotPassword.devResetLink")}
                  </p>
                  <Link
                    to={`/reset-password/${resetToken}`}
                    dir="ltr"
                    className="break-all text-xs text-primary underline"
                  >
                    /reset-password/{resetToken}
                  </Link>
                </div>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">{t("auth.forgotPassword.backToLogin")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">{t("auth.forgotPassword.email")}</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="email"
                    type="email"
                    className="ps-10"
                    dir="ltr"
                    placeholder="example@email.com"
                    {...form.register("email")}
                    error={form.formState.errors.email?.message}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t("auth.forgotPassword.button")}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login" className="gap-2">
                  {t("auth.forgotPassword.backToLogin")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
