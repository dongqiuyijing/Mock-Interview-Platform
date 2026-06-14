import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  FileSearch,
  MessagesSquare,
  ClipboardCheck,
  Target,
  Sparkles,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const ctaTarget = user ? "/dashboard" : "/login";

  const steps = [
    { icon: FileSearch, key: "step1" },
    { icon: Target, key: "step2" },
    { icon: MessagesSquare, key: "step3" },
    { icon: ClipboardCheck, key: "step4" },
  ];

  const features = [
    { icon: Target, key: "feat1" },
    { icon: MessagesSquare, key: "feat2" },
    { icon: Gauge, key: "feat3" },
    { icon: Sparkles, key: "feat4" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-subtle" />
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="container relative py-24 text-center md:py-32">
          <Badge variant="secondary" className="mb-6 animate-fade-in">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {t("home.badge")}
          </Badge>
          <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight animate-fade-in md:text-6xl">
            {t("home.hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground animate-fade-in">
            {t("home.hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 animate-fade-in sm:flex-row">
            <Button size="lg" asChild className="shadow-glow">
              <Link to={ctaTarget}>
                {t("home.hero.cta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("home.hero.note")}</p>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t("home.how.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          {t("home.how.subtitle")}
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-4">
          {steps.map((step, i) => (
            <Card
              key={step.key}
              className="relative border-border/60 p-6 transition-smooth hover:shadow-card"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg gradient-primary">
                <step.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="absolute right-5 top-5 text-3xl font-bold text-muted/60">
                {i + 1}
              </span>
              <h3 className="font-semibold">{t(`home.${step.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t(`home.${step.key}.desc`)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-muted/30 py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            {t("home.features.title")}
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.key} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">{t(`home.${f.key}.title`)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t(`home.${f.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <Card className="relative overflow-hidden border-none gradient-hero p-12 text-center shadow-elegant">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground">
            {t("home.cta.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            {t("home.cta.subtitle")}
          </p>
          <Button size="lg" variant="secondary" asChild className="mt-8">
            <Link to={ctaTarget}>
              {t("home.hero.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          {t("home.footer")}
        </div>
      </footer>
    </div>
  );
};

export default Index;
