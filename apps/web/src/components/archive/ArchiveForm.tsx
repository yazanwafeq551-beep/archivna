import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileUploader } from "./FileUploader";
import { MATERIAL_TYPES, ACCESS_LEVELS } from "@/lib/constants";
import { useCreateArchive, useUpdateArchive, useUploadFiles } from "@/hooks/useArchive";
import type { CreateArchiveRequest } from "@/api/archives";
import { catalogApi, flattenUnits } from "@/api/catalog";
import { governanceApi } from "@/api/governance";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const archiveSchema = z.object({
  titleAr: z.string().min(1, "العنوان بالعربية مطلوب"),
  titleEn: z.string().optional(),
  referenceNumber: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  institution: z.string().optional(),
  institutionId: z.string().optional(),
  archivalUnitId: z.string().optional(),
  creator: z.string().optional(),
  subjects: z.string().optional(),
  place: z.string().optional(),
  language: z.string().optional(),
  materialType: z.string().optional(),
  accessLevel: z.string().optional(),
  rights: z.string().optional(),
});

type ArchiveFormData = z.infer<typeof archiveSchema>;

interface ArchiveFormProps {
  initialData?: Partial<ArchiveFormData>;
  archiveId?: string;
  onSuccess?: () => void;
}

export function ArchiveForm({ initialData, archiveId, onSuccess }: ArchiveFormProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const createArchive = useCreateArchive();
  const updateArchive = useUpdateArchive();
  const uploadFiles = useUploadFiles();
  const { user } = useAuth();

  const form = useForm<ArchiveFormData>({
    resolver: zodResolver(archiveSchema),
    mode: "onChange",
    defaultValues: {
      titleAr: initialData?.titleAr || "",
      titleEn: initialData?.titleEn || "",
      referenceNumber: initialData?.referenceNumber || "",
      description: initialData?.description || "",
      date: initialData?.date || "",
      dateFrom: initialData?.dateFrom || "",
      dateTo: initialData?.dateTo || "",
      institution: initialData?.institution || "",
      institutionId: initialData?.institutionId || user?.institutionId || "",
      archivalUnitId: initialData?.archivalUnitId || "",
      creator: initialData?.creator || "",
      subjects: initialData?.subjects || "",
      place: initialData?.place || "",
      language: initialData?.language || "",
      materialType: initialData?.materialType || "",
      accessLevel: initialData?.accessLevel || "",
      rights: initialData?.rights || "",
    },
  });

  const isSaving =
    createArchive.isPending || updateArchive.isPending || uploadFiles.isPending;

  const titleAr = form.watch("titleAr");
  const institutionId = form.watch("institutionId");
  const { data: institutions = [] } = useQuery({ queryKey: ["institutions"], queryFn: catalogApi.institutions });
  const { data: hierarchy } = useQuery({
    queryKey: ["archive-hierarchy", institutionId],
    queryFn: () => catalogApi.hierarchy(institutionId!),
    enabled: Boolean(institutionId),
  });
  const units = flattenUnits(hierarchy?.units || []);

  const steps = [
    { number: 1, title: t("dashboard.newArchive.steps.upload") },
    { number: 2, title: t("dashboard.newArchive.steps.info") },
    { number: 3, title: t("dashboard.newArchive.steps.classify") },
    { number: 4, title: t("dashboard.newArchive.steps.review") },
  ];

  const canProceed = () => {
    if (step === 1) return files.length > 0 || !!archiveId;
    if (step === 2) return !!titleAr;
    return true;
  };

  const onSubmit = async (data: ArchiveFormData, intent: "draft" | "submit") => {
    try {
      const subjectsArray = data.subjects
        ? data.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload: CreateArchiveRequest = {
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        referenceNumber: data.referenceNumber,
        description: data.description,
        date: data.date,
        date_from: data.dateFrom || undefined,
        date_to: data.dateTo || undefined,
        institution: data.institution,
        institutionId: data.institutionId,
        archivalUnitId: data.archivalUnitId,
        creator: data.creator,
        place: data.place,
        language: data.language,
        rights: data.rights,
        materialType: data.materialType || "document",
        subjects: subjectsArray,
        accessLevel: (data.accessLevel || "public") as "public" | "sensitive" | "sovereign",
        status: "draft",
      };

      let savedArchiveId = archiveId;
      if (archiveId) {
        await updateArchive.mutateAsync({ id: archiveId, data: payload });
      } else {
        const archive = await createArchive.mutateAsync(payload);
        savedArchiveId = archive.id;
      }

      // Files picked in step one belong to the record either way - when
      // editing they used to be dropped on the floor.
      if (files.length > 0 && savedArchiveId) {
        await uploadFiles.mutateAsync({
          archiveId: savedArchiveId,
          files,
          onProgress: setUploadProgress,
        });
        setFiles([]);
      }

      if (intent === "submit" && savedArchiveId) {
        await governanceApi.transition(savedArchiveId, "submit");
        toast.success(t("dashboard.newArchive.review.submitSuccess"));
      }

      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step >= s.number
                  ? "bg-primary text-white"
                  : "bg-muted-bg text-muted"
              }`}
            >
              {s.number}
            </div>
            <span className={`ms-2 text-sm hidden sm:inline ${
              step >= s.number ? "text-foreground" : "text-muted"
            }`}>
              {s.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`mx-2 h-px w-8 sm:w-16 ${
                step > s.number ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.newArchive.upload.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader onFilesChange={setFiles} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.newArchive.steps.info")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("dashboard.newArchive.info.titleAr") + " *"}
                {...form.register("titleAr")}
                error={form.formState.errors.titleAr?.message}
              />
              <Input
                label={t("dashboard.newArchive.info.titleEn")}
                {...form.register("titleEn")}
                dir="ltr"
              />
            </div>
            <Input
              label={t("dashboard.newArchive.info.reference")}
              {...form.register("referenceNumber")}
            />
            <Textarea
              label={t("dashboard.newArchive.info.description")}
              {...form.register("description")}
              rows={4}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/*
                Archival dating is rarely a calendar date: records carry things
                like "1936-1938" or "قبل النكبة", and the API stores the value
                as free text. A date picker silently dropped those on edit.
              */}
              <Input
                label={t("dashboard.newArchive.info.date")}
                placeholder={t("dashboard.newArchive.info.datePlaceholder")}
                {...form.register("date")}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  dir="ltr"
                  label={t("dashboard.newArchive.info.dateFrom")}
                  {...form.register("dateFrom")}
                />
                <Input
                  type="date"
                  dir="ltr"
                  label={t("dashboard.newArchive.info.dateTo")}
                  {...form.register("dateTo")}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("dashboard.newArchive.info.institution")}</Label>
                <Select value={institutionId} onValueChange={(value) => {
                  const institution = institutions.find((item) => item.id === value);
                  form.setValue("institutionId", value);
                  form.setValue("institution", institution?.nameAr || "");
                  form.setValue("archivalUnitId", "");
                }}>
                  <SelectTrigger><SelectValue placeholder={t("auth.register.selectInstitution")} /></SelectTrigger>
                  <SelectContent>{institutions.map((institution) => <SelectItem key={institution.id} value={institution.id}>{institution.nameAr}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Input
              label={t("dashboard.newArchive.info.creator")}
              {...form.register("creator")}
            />
            <div>
              <Label className="mb-1.5 block">{t("dashboard.newArchive.info.archivalUnit")}</Label>
              <Select value={form.watch("archivalUnitId")} onValueChange={(value) => form.setValue("archivalUnitId", value)} disabled={!institutionId}>
                <SelectTrigger><SelectValue placeholder={t("dashboard.newArchive.info.selectArchivalUnit")} /></SelectTrigger>
                <SelectContent>{units.map((unit) => <SelectItem key={unit.id} value={unit.id}>{"—".repeat(unit.depth)} {unit.titleAr} {unit.referenceCode ? `(${unit.referenceCode})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input
              label={t("dashboard.newArchive.classify.subjects")}
              placeholder={t("dashboard.newArchive.classify.subjectsPlaceholder")}
              {...form.register("subjects")}
            />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.newArchive.steps.classify")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">{t("dashboard.newArchive.classify.materialType")} *</Label>
                <Select
                  value={form.watch("materialType")}
                  onValueChange={(value) => form.setValue("materialType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.newArchive.classify.materialType")} />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {t("materialTypes." + type.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("dashboard.newArchive.classify.accessLevel")} *</Label>
                <Select
                  value={form.watch("accessLevel")}
                  onValueChange={(value) => form.setValue("accessLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.newArchive.classify.accessLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {t("accessLevels." + level.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t("dashboard.newArchive.classify.place")}
                {...form.register("place")}
              />
              <Input
                label={t("dashboard.newArchive.classify.language")}
                {...form.register("language")}
              />
            </div>
            <Textarea
              label={t("dashboard.newArchive.classify.rights")}
              {...form.register("rights")}
              rows={3}
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.newArchive.review.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted">{t("dashboard.newArchive.review.titleArLabel")}</Label>
                <p className="text-foreground">{form.getValues("titleAr") || "-"}</p>
              </div>
              <div>
                <Label className="text-muted">{t("dashboard.newArchive.review.titleEnLabel")}</Label>
                <p className="text-foreground ltr">{form.getValues("titleEn") || "-"}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted">{t("dashboard.newArchive.review.referenceLabel")}</Label>
                <p className="text-foreground">{form.getValues("referenceNumber") || "-"}</p>
              </div>
              <div>
                <Label className="text-muted">{t("dashboard.newArchive.review.dateLabel")}</Label>
                <p className="text-foreground">{form.getValues("date") || "-"}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted">{t("dashboard.newArchive.review.descriptionLabel")}</Label>
              <p className="text-foreground">{form.getValues("description") || "-"}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted">{t("dashboard.newArchive.review.materialTypeLabel")}</Label>
                <p className="text-foreground">
                  {form.getValues("materialType") ? t("materialTypes." + form.getValues("materialType")!) : "-"}
                </p>
              </div>
              <div>
                <Label className="text-muted">{t("dashboard.newArchive.review.accessLevelLabel")}</Label>
                <p className="text-foreground">
                  {form.getValues("accessLevel") ? t("accessLevels." + form.getValues("accessLevel")!) : "-"}
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted">{t("dashboard.newArchive.review.filesLabel")} ({files.length})</Label>
                  <ul className="mt-1 space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="text-sm text-foreground">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="h-2" />
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              {t("common.previous")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              {t("common.next")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => form.handleSubmit((data) => onSubmit(data, "draft"))()}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {t("dashboard.newArchive.review.saveDraft")}
              </Button>
              <Button
                onClick={() => form.handleSubmit((data) => onSubmit(data, "submit"))()}
                isLoading={isSaving}
                disabled={isSaving}
              >
                {t("dashboard.newArchive.review.submit")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
