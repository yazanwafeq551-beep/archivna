import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, User, Phone, Building, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/hooks/useAuth";
import apiClient from "@/api/client";
import { toast } from "sonner";
import { debounce } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiError";


interface Institution {
  id: string;
  nameAr: string;
  nameEn?: string;
  type?: string;
}

const institutionTypes = [
  "university",
  "college",
  "research_center",
  "library",
  "archive",
  "museum",
  "government",
  "other",
];

const registerBaseSchema = z.object({
  accountType: z.enum(["individual", "institution_representative"]),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  terms: z.boolean().refine((val) => val === true),
  institutionId: z.string().optional(),
  registerNewInstitution: z.boolean().optional(),
  newInstitutionNameAr: z.string().optional(),
  newInstitutionNameEn: z.string().optional(),
  newInstitutionType: z.string().optional(),
  newInstitutionContactPerson: z.string().optional(),
  newInstitutionEmail: z.string().optional(),
  newInstitutionPhone: z.string().optional(),
  newInstitutionAddress: z.string().optional(),
  newInstitutionCity: z.string().optional(),
  newInstitutionWebsite: z.string().optional(),
});

const registerSchema = registerBaseSchema
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.register.passwordMismatch",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.accountType === "institution_representative") {
        return !!data.institutionId;
      }
      return true;
    },
    { message: "auth.register.institutionRequired", path: ["institutionId"] }
  )
  .refine(
    (data) => {
      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        return !!data.newInstitutionNameAr;
      }
      return true;
    },
    {
      message: "auth.register.institutionNameArRequired",
      path: ["newInstitutionNameAr"],
    }
  )
  .refine(
    (data) => {
      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        return !!data.newInstitutionType;
      }
      return true;
    },
    {
      message: "auth.register.institutionTypeRequired",
      path: ["newInstitutionType"],
    }
  )
  .refine(
    (data) => {
      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        return !!data.newInstitutionContactPerson;
      }
      return true;
    },
    {
      message: "auth.register.contactPersonRequired",
      path: ["newInstitutionContactPerson"],
    }
  )
  .refine(
    (data) => {
      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        return !!data.newInstitutionEmail;
      }
      return true;
    },
    {
      message: "auth.register.institutionEmailRequired",
      path: ["newInstitutionEmail"],
    }
  )
  .refine(
    (data) => {
      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        return !!data.newInstitutionAddress;
      }
      return true;
    },
    {
      message: "auth.register.institutionAddressRequired",
      path: ["newInstitutionAddress"],
    }
  )
  .refine(
    (data) => {
      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        return !!data.newInstitutionCity;
      }
      return true;
    },
    {
      message: "auth.register.institutionCityRequired",
      path: ["newInstitutionCity"],
    }
  );

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionSearch, setInstitutionSearch] = useState("");
  const [isSearchingInstitutions, setIsSearchingInstitutions] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "individual",
      terms: false,
      registerNewInstitution: false,
    },
  });

  const accountType = form.watch("accountType");
  const institutionId = form.watch("institutionId");
  const showNewInstitutionForm =
    accountType === "institution_representative" &&
    institutionId === "registerNew";

  const searchInstitutionsRef = useRef(
    debounce(async (query: string) => {
      setIsSearchingInstitutions(true);
      try {
        const response = await apiClient.get("/institutions", {
          params: { q: query },
        });
        setInstitutions(response.data);
      } catch {
        setInstitutions([]);
      } finally {
        setIsSearchingInstitutions(false);
      }
    }, 300)
  );

  useEffect(() => {
    if (accountType === "institution_representative") {
      searchInstitutionsRef.current(institutionSearch);
    }
  }, [institutionSearch, accountType]);

  useEffect(() => {
    if (accountType === "institution_representative") {
      searchInstitutionsRef.current("");
    }
  }, [accountType]);

  const createInstitution = async (): Promise<string | null> => {
    const values = form.getValues();
    try {
      const response = await apiClient.post("/institutions", {
        nameAr: values.newInstitutionNameAr,
        nameEn: values.newInstitutionNameEn,
        type: values.newInstitutionType,
        contactPerson: values.newInstitutionContactPerson,
        email: values.newInstitutionEmail,
        phone: values.newInstitutionPhone,
        address: values.newInstitutionAddress,
        city: values.newInstitutionCity,
        website: values.newInstitutionWebsite,
      });
      return response.data.id;
    } catch {
      return null;
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      let finalInstitutionId = data.institutionId;

      if (
        data.accountType === "institution_representative" &&
        data.institutionId === "registerNew"
      ) {
        const newId = await createInstitution();
        if (!newId) {
          toast.error(t("auth.register.institutionCreationFailed"));
          setIsLoading(false);
          return;
        }
        finalInstitutionId = newId;
      }

      await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone,
        institutionName:
          data.accountType === "institution_representative"
            ? data.newInstitutionNameAr
            : undefined,
        institutionId:
          data.accountType === "institution_representative"
            ? finalInstitutionId
            : undefined,
        accountType: data.accountType,
      });
      toast.success(t("auth.register.success"));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("auth.register.error")));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo variant="icon" size="lg" />
          </div>
          <CardTitle className="text-xl">
            {t("auth.register.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>{t("auth.register.accountType")}</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Button
                  type="button"
                  variant={
                    accountType === "individual" ? "default" : "outline"
                  }
                  onClick={() => {
                    form.setValue("accountType", "individual");
                    form.setValue("institutionId", undefined);
                    form.setValue("registerNewInstitution", false);
                  }}
                >
                  <User className="ms-2 h-4 w-4" />
                  {t("auth.register.individual")}
                </Button>
                <Button
                  type="button"
                  variant={
                    accountType === "institution_representative"
                      ? "default"
                      : "outline"
                  }
                  onClick={() =>
                    form.setValue(
                      "accountType",
                      "institution_representative"
                    )
                  }
                >
                  <Building className="ms-2 h-4 w-4" />
                  {t("auth.register.institutionRepresentative")}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="fullName">
                {t("auth.register.fullName")} *
              </Label>
              <div className="relative mt-1.5">
                <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="fullName"
                  className="ps-10"
                  {...form.register("fullName")}
                  error={form.formState.errors.fullName?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">
                {t("auth.register.email")} *
              </Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="password">
                  {t("auth.register.password")} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  error={form.formState.errors.password?.message}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">
                  {t("auth.register.confirmPassword")} *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register("confirmPassword")}
                  error={form.formState.errors.confirmPassword?.message}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">
                {t("auth.register.phone")}
              </Label>
              <div className="relative mt-1.5">
                <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  id="phone"
                  type="tel"
                  className="ps-10"
                  dir="ltr"
                  {...form.register("phone")}
                />
              </div>
            </div>

            {accountType === "institution_representative" && (
              <div className="space-y-4 rounded-md border border-border p-4">
                <div>
                  <Label>
                    {t("auth.register.selectInstitution")} *
                  </Label>
                  <div className="relative mt-1.5">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      className="ps-10"
                      placeholder={t("auth.register.searchInstitutions")}
                      value={institutionSearch}
                      onChange={(e) =>
                        setInstitutionSearch(e.target.value)
                      }
                    />
                  </div>
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {isSearchingInstitutions && (
                      <p className="text-sm text-muted py-2">
                        {t("auth.register.searching")}
                      </p>
                    )}
                    {!isSearchingInstitutions &&
                      institutions.map((inst) => (
                        <div
                          key={inst.id}
                          className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                            institutionId === inst.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted-bg"
                          }`}
                          onClick={() =>
                            form.setValue("institutionId", inst.id)
                          }
                        >
                          <Building className="h-4 w-4 shrink-0 text-muted" />
                          <div>
                            <p className="text-sm font-medium">
                              {inst.nameAr}
                            </p>
                            {inst.nameEn && (
                              <p className="text-xs text-muted">
                                {inst.nameEn}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    {!isSearchingInstitutions &&
                      institutions.length === 0 &&
                      institutionSearch && (
                        <p className="text-sm text-muted py-2">
                          {t("auth.register.noInstitutions")}
                        </p>
                      )}
                    <div
                      className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                        institutionId === "independent"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted-bg"
                      }`}
                      onClick={() =>
                        form.setValue("institutionId", "independent")
                      }
                    >
                      <User className="h-4 w-4 shrink-0 text-muted" />
                      <p className="text-sm font-medium">
                        {t("auth.register.independent")}
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-2 rounded-md border p-2 cursor-pointer transition-colors ${
                        institutionId === "registerNew"
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted-bg"
                      }`}
                      onClick={() =>
                        form.setValue("institutionId", "registerNew")
                      }
                    >
                      <Plus className="h-4 w-4 shrink-0 text-muted" />
                      <p className="text-sm font-medium">
                        {t("auth.register.registerNewInstitution")}
                      </p>
                    </div>
                  </div>
                  {form.formState.errors.institutionId?.message && (
                    <p className="mt-1 text-sm text-destructive">
                      {t(
                        form.formState.errors.institutionId.message
                      )}
                    </p>
                  )}
                </div>

                {showNewInstitutionForm && (
                  <div className="space-y-4 border-t border-border pt-4">
                    <p className="text-sm font-medium text-foreground">
                      {t("auth.register.newInstitutionDetails")}
                    </p>

                    <div>
                      <Label>
                        {t("auth.register.institutionNameAr")} *
                      </Label>
                      <Input
                        className="mt-1.5"
                        {...form.register(
                          "newInstitutionNameAr"
                        )}
                        error={
                          form.formState.errors
                            .newInstitutionNameAr?.message
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionNameEn")}
                      </Label>
                      <Input
                        className="mt-1.5"
                        {...form.register(
                          "newInstitutionNameEn"
                        )}
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionType")} *
                      </Label>
                      <Select
                        value={form.watch("newInstitutionType")}
                        onValueChange={(val) =>
                          form.setValue("newInstitutionType", val)
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue
                            placeholder={t(
                              "auth.register.selectInstitutionType"
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {institutionTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(
                                `auth.register.institutionTypes.${type}`
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.newInstitutionType
                        ?.message && (
                        <p className="mt-1 text-sm text-destructive">
                          {t(
                            form.formState.errors
                              .newInstitutionType.message
                          )}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.contactPerson")} *
                      </Label>
                      <Input
                        className="mt-1.5"
                        {...form.register(
                          "newInstitutionContactPerson"
                        )}
                        error={
                          form.formState.errors
                            .newInstitutionContactPerson?.message
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionEmail")} *
                      </Label>
                      <Input
                        type="email"
                        className="mt-1.5"
                        dir="ltr"
                        {...form.register(
                          "newInstitutionEmail"
                        )}
                        error={
                          form.formState.errors
                            .newInstitutionEmail?.message
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionPhone")}
                      </Label>
                      <Input
                        type="tel"
                        className="mt-1.5"
                        dir="ltr"
                        {...form.register(
                          "newInstitutionPhone"
                        )}
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionAddress")} *
                      </Label>
                      <Input
                        className="mt-1.5"
                        {...form.register(
                          "newInstitutionAddress"
                        )}
                        error={
                          form.formState.errors
                            .newInstitutionAddress?.message
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionCity")} *
                      </Label>
                      <Input
                        className="mt-1.5"
                        {...form.register("newInstitutionCity")}
                        error={
                          form.formState.errors
                            .newInstitutionCity?.message
                        }
                      />
                    </div>

                    <div>
                      <Label>
                        {t("auth.register.institutionWebsite")}
                      </Label>
                      <Input
                        type="url"
                        className="mt-1.5"
                        dir="ltr"
                        {...form.register(
                          "newInstitutionWebsite"
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={form.watch("terms")}
                onCheckedChange={(checked) =>
                  form.setValue("terms", checked as boolean)
                }
              />
              <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
                {t("auth.register.terms")}
              </Label>
            </div>
            {form.formState.errors.terms?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.terms.message}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {t("auth.register.button")}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted">
            {t("auth.register.hasAccount")}{" "}
            <Link
              to="/login"
              className="text-primary hover:underline font-medium"
            >
              {t("auth.register.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
