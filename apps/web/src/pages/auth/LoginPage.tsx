import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock } from "lucide-react";
import { getApiErrorMessage } from "@/lib/apiError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email(i18n.t("validation.invalidEmail")),
  password: z.string().min(1, i18n.t("validation.passwordRequired")),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Where the user was headed before ProtectedRoute sent them here.
  const redirectTo =
    (location.state as { from?: { pathname: string; search?: string } } | null)?.from
      ?.pathname ?? "/dashboard";

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirectTo]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password, rememberMe);
      toast.success(t("auth.login.success"));
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("auth.login.error")));
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
          <CardTitle className="text-xl">{t("auth.login.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">{t("auth.login.email")}</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="email"
                  type="email"
                  className="ps-10"
                  placeholder="example@email.com"
                  dir="ltr"
                  {...form.register("email")}
                  error={form.formState.errors.email?.message}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">{t("auth.login.password")}</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="password"
                  type="password"
                  className="ps-10"
                  {...form.register("password")}
                  error={form.formState.errors.password?.message}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                  {t("auth.login.rememberMe")}
                </Label>
              </div>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t("auth.login.forgotPassword")}
              </Link>
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t("auth.login.button")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted">
            {t("auth.login.noAccount")}{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              {t("auth.login.register")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
