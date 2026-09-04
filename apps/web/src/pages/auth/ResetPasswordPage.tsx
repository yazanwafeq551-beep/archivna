import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

const resetSchema = z
  .object({
    password: z.string().min(8, i18n.t("validation.passwordMinLength")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t("validation.passwordsNotMatch"),
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setIsSubmitted(true);
      toast.success(t("auth.resetPassword.success"));
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
          <CardTitle className="text-xl">{t("auth.resetPassword.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Lock className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted">
                {t("auth.resetPassword.success")}
              </p>
              <Button asChild className="w-full">
                <a href="/login">{t("auth.forgotPassword.backToLogin")}</a>
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="password">{t("auth.resetPassword.newPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  className="mt-1.5"
                  {...form.register("password")}
                  error={form.formState.errors.password?.message}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">{t("auth.resetPassword.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="mt-1.5"
                  {...form.register("confirmPassword")}
                  error={form.formState.errors.confirmPassword?.message}
                />
              </div>
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t("auth.resetPassword.button")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
