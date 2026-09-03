import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { GraduationCap, CheckCircle2, BookOpen, BarChart3, RefreshCw, Award } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GuestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  { icon: BookOpen, key: "accessCourses" },
  { icon: BarChart3, key: "trackProgress" },
  { icon: RefreshCw, key: "resumeLearning" },
  { icon: Award, key: "earnCertificates" },
];

export function GuestModal({ open, onOpenChange }: GuestModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border-gold-light/40 bg-[#FDFCF9] p-0 rounded-2xl">
        <div className="bg-gradient-to-br from-primary to-primary/90 px-6 pb-8 pt-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 ring-4 ring-gold/10">
            <GraduationCap className="h-8 w-8 text-gold" />
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {t("lms.guestModal.title")}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-white/80">
            {t("lms.guestModal.subtitle")}
          </DialogDescription>
        </div>

        <div className="px-6 pb-6 pt-4">
          <ul className="mb-6 space-y-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li key={benefit.key} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                  <span className="text-sm text-foreground/80">
                    {t(`lms.guestModal.benefits.${benefit.key}`)}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-3">
            <Button
              asChild
              variant="gold"
              size="lg"
              className="w-full text-base font-semibold shadow-lg shadow-gold/20"
              onClick={() => onOpenChange(false)}
            >
              <Link to="/register">{t("lms.guestModal.createAccount")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => onOpenChange(false)}
            >
              <Link to="/login">{t("lms.guestModal.login")}</Link>
            </Button>
            <p className="text-center text-xs text-muted">
              {t("lms.guestModal.alreadyHaveAccount")}{" "}
              <Link to="/login" className="font-medium text-gold hover:underline">
                {t("lms.guestModal.signIn")}
              </Link>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
