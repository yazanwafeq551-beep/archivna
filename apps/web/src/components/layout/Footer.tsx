import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/shared/Logo";
import { Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-gold/30 bg-primary-dark text-white">
      <div className="absolute -end-24 -top-24 h-72 w-72 rounded-full border border-gold/10" />
      <div className="container-app relative py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.35fr_.8fr_.8fr_1fr]">
          {/* About */}
          <div className="space-y-4">
            <div className="inline-flex rounded-xl bg-ivory px-3 py-2"><Logo variant="full" size="md" /></div>
            <p className="text-sm text-white/70 leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-gold-light">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-white/70 hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-sm text-white/70 hover:text-white transition-colors">
                  {t("nav.search")}
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-sm text-white/70 hover:text-white transition-colors">
                  {t("nav.news")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-white/70 hover:text-white transition-colors">
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-gold-light">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-white/70 hover:text-white transition-colors">
                  {t("footer.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-white/70 hover:text-white transition-colors">
                  {t("footer.termsOfUse")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-gold-light">{t("footer.contact")}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="h-4 w-4 shrink-0" />
                <span>info@archivna.ps</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+970 2 XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{t("footer.address")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/50">
            © {currentYear} {t("app.name")}. {t("footer.rights")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
