import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogApi } from "@/api/catalog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MATERIAL_TYPES, ACCESS_LEVELS } from "@/lib/constants";
import type { SearchFilters as SearchFiltersType } from "@/api/search";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFilterChange: (key: keyof SearchFiltersType, value: unknown) => void;
  onReset: () => void;
  /** Focus the institution field on mount, for ?browse=institution. */
  focusInstitution?: boolean;
}

export function SearchFilters({ filters, onFilterChange, onReset, focusInstitution }: SearchFiltersProps) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language.startsWith("ar");

  // Every institution on the platform, so the reader picks one instead of
  // guessing how its name is spelled.
  const { data: institutions } = useQuery({
    queryKey: ["institutions"],
    queryFn: catalogApi.institutions,
    staleTime: 5 * 60_000,
  });

  const handleTypeToggle = (type: string) => {
    const current = filters.materialType || [];
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    onFilterChange("materialType", updated);
  };

  const handleAccessToggle = (level: string) => {
    const current = filters.accessLevel || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onFilterChange("accessLevel", updated);
  };

  return (
    <div className="space-y-6">
      {/* Institution - the archive is organised by institution, so this is
          the filter most readers reach for first. */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.institution")}</h3>
        <Select
          value={filters.institution || "all"}
          onValueChange={(value) => onFilterChange("institution", value === "all" ? "" : value)}
        >
          <SelectTrigger autoFocus={focusInstitution}>
            <SelectValue placeholder={t("search.allInstitutions")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("search.allInstitutions")}</SelectItem>
            {institutions?.map((institution) => (
              <SelectItem key={institution.id} value={institution.id}>
                {isArabic ? institution.nameAr : institution.nameEn || institution.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Material Type */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.type")}</h3>
        <div className="space-y-2">
          {MATERIAL_TYPES.map((type) => (
            <div key={type.value} className="flex items-center gap-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={(filters.materialType || []).includes(type.value)}
                onCheckedChange={() => handleTypeToggle(type.value)}
              />
              <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                {t("materialTypes." + type.value)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Date Range */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.dateRange")}</h3>
        <div className="space-y-2">
          <Input
            type="date"
            label={t("search.dateFrom")}
            value={filters.dateFrom || ""}
            onChange={(e) => onFilterChange("dateFrom", e.target.value)}
          />
          <Input
            type="date"
            label={t("search.dateTo")}
            value={filters.dateTo || ""}
            onChange={(e) => onFilterChange("dateTo", e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Subject */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.subject")}</h3>
        <Input
          placeholder={t("search.subject")}
          value={filters.subject || ""}
          onChange={(e) => onFilterChange("subject", e.target.value)}
        />
      </div>

      <Separator />

      {/* Place */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.place")}</h3>
        <Input
          placeholder={t("search.place")}
          value={filters.place || ""}
          onChange={(e) => onFilterChange("place", e.target.value)}
        />
      </div>

      <Separator />

      {/* Language */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.language")}</h3>
        <Input
          placeholder={t("search.language")}
          value={filters.language || ""}
          onChange={(e) => onFilterChange("language", e.target.value)}
        />
      </div>

      <Separator />

      {/* Access Level */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">{t("search.access")}</h3>
        <div className="space-y-2">
          {ACCESS_LEVELS.map((level) => (
            <div key={level.value} className="flex items-center gap-2">
              <Checkbox
                id={`access-${level.value}`}
                checked={(filters.accessLevel || []).includes(level.value)}
                onCheckedChange={() => handleAccessToggle(level.value)}
              />
              <Label htmlFor={`access-${level.value}`} className="text-sm cursor-pointer">
                {t("accessLevels." + level.value)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={onReset}>
        {t("search.resetFilters")}
      </Button>
    </div>
  );
}
