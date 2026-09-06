import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GraduationCap } from "lucide-react";
import { SectionHero } from "@/components/layout/SectionHero";
import { CapacityPrograms } from "@/components/lms/CapacityPrograms";
import { getStoredReducedMotion } from "@/lib/appearance";

/**
 * Section 2. Capacity building is three programmes, and nothing else at this
 * level: the training material behind the first of them is a page of its own.
 */
export function CapacityPage() {
  const { t } = useTranslation();
  const { hash } = useLocation();

  // React Router does not act on a #hash by itself, so /lms#programs-live would
  // otherwise land at the top of the page.
  useEffect(() => {
    if (!hash) return;
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    const still =
      getStoredReducedMotion() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  }, [hash]);

  return (
    <div>
      <SectionHero
        number={2}
        icon={<GraduationCap className="h-7 w-7" />}
        title={t("sections.capacity.title")}
        description={t("sections.capacity.description")}
      />
      <CapacityPrograms />
    </div>
  );
}
