import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, type UpdateProfileRequest } from "@/api/profile";
import { LoadingSpinner } from "@/components/shared";
import { getInitials } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  fullName: z.string().min(2, i18n.t("validation.nameMinLength")),
  phone: z.string().optional(),
  institution: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, i18n.t("validation.currentPasswordRequired")),
  newPassword: z.string().min(8, i18n.t("validation.newPasswordMinLength")),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: i18n.t("validation.passwordsNotMatch"),
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, refreshUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      institution: user?.institutionName || "",
      bio: user?.bio || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // The profile usually arrives after the first render, so seed the form once
  // it does instead of leaving the fields blank.
  useEffect(() => {
    if (!user) return;
    profileForm.reset({
      fullName: user.fullName || "",
      phone: user.phone || "",
      institution: user.institutionName || "",
      bio: user.bio || "",
    });
  }, [user, profileForm]);

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileRequest) => profileApi.updateProfile(data),
    onSuccess: async () => {
      await refreshUser();
      toast.success(t("dashboard.profile.saved"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: PasswordFormData) => profileApi.changePassword(data),
    onSuccess: () => {
      passwordForm.reset();
      toast.success(t("dashboard.profile.passwordChanged"));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);

    try {
      await profileApi.uploadAvatar(file);
      // Only drop the local preview once the stored image is in place.
      await refreshUser();
      toast.success(t("dashboard.profile.saved"));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
      setAvatarPreview(null);
      URL.revokeObjectURL(previewUrl);
      e.target.value = "";
    }
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePassword.mutate(data);
  };

  if (authLoading) {
    return <LoadingSpinner size="lg" className="py-20" />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-heading font-bold text-foreground">
        {t("dashboard.profile.title")}
      </h2>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.profile.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview || user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback className="text-lg">{getInitials(user?.fullName || "")}</AvatarFallback>
              </Avatar>
              <label
                className={`absolute -bottom-1 -start-1 rounded-full bg-primary p-1.5 text-white shadow-sm hover:bg-primary-dark ${
                  isUploadingAvatar ? "pointer-events-none opacity-70" : "cursor-pointer"
                }`}
                aria-busy={isUploadingAvatar}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={isUploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div>
              <p className="font-medium text-foreground">{user?.fullName}</p>
              <p className="text-sm text-muted">{user?.email}</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <Input
              label={t("dashboard.profile.fullName")}
              {...profileForm.register("fullName")}
              error={profileForm.formState.errors.fullName?.message}
            />
            <Input
              label={t("dashboard.profile.email")}
              value={user?.email || ""}
              disabled
              dir="ltr"
            />
            <Input
              label={t("dashboard.profile.phone")}
              {...profileForm.register("phone")}
              dir="ltr"
            />
            <Input
              label={t("dashboard.profile.institution")}
              {...profileForm.register("institution")}
            />
            <Textarea
              label={t("dashboard.profile.bio")}
              {...profileForm.register("bio")}
              rows={4}
            />
            <Button type="submit" isLoading={updateProfile.isPending}>
              <Save className="ms-1 h-4 w-4" />
              {t("dashboard.profile.save")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.profile.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label={t("dashboard.profile.currentPassword")}
              type="password"
              {...passwordForm.register("currentPassword")}
              error={passwordForm.formState.errors.currentPassword?.message}
            />
            <Input
              label={t("dashboard.profile.newPassword")}
              type="password"
              {...passwordForm.register("newPassword")}
              error={passwordForm.formState.errors.newPassword?.message}
            />
            <Input
              label={t("dashboard.profile.confirmPassword")}
              type="password"
              {...passwordForm.register("confirmPassword")}
              error={passwordForm.formState.errors.confirmPassword?.message}
            />
            <Button type="submit" variant="outline" isLoading={changePassword.isPending}>
              <Lock className="ms-1 h-4 w-4" />
              {t("dashboard.profile.changePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
