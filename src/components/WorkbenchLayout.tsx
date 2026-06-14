import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
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
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight">{t("app.name")}</div>
              <div className="text-[11px] text-muted-foreground">{t("app.tagline")}</div>
            </div>
          </Link>
          <LanguageSwitcher className="h-9" />
        </div>
      </header>

      <div className="border-b border-border bg-card/60">
        <div className="container py-4">
          <Stepper current={step} />
        </div>
      </div>

      <main className="container flex-1 py-8">{children}</main>
    </div>
  );
};
