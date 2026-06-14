import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Stepper, StepId } from "@/components/Stepper";

interface WorkbenchLayoutProps {
  step: StepId;
  children: ReactNode;
}

export const WorkbenchLayout = ({ step, children }: WorkbenchLayoutProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-baseline gap-2.5">
            <span className="display text-lg">{t("app.name")}</span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              {t("app.tagline")}
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Stepper current={step} />
            <LanguageSwitcher className="h-9 w-[120px] rounded-full border-border text-xs" />
          </div>
        </div>
      </header>

      <main className="container flex-1 py-12 sm:py-16">{children}</main>

      <footer className="border-t border-border">
        <div className="container flex h-14 items-center justify-between text-[11px] text-muted-foreground">
          <span>{t("app.name")}</span>
          <span className="label-eyebrow">{t("app.tagline")}</span>
        </div>
      </footer>
    </div>
  );
};
