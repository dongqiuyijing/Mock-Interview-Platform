import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarCheck, Check, Circle, ArrowRight, Target } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { store, TrainingDay } from "@/lib/workspaceStore";
import { cn } from "@/lib/utils";

const TrainingPlan = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TrainingDay[]>(() => store.getPlan());

  const done = plan.filter((d) => d.done).length;
  const progress = Math.round((done / plan.length) * 100);

  const toggle = (id: string) => setPlan(store.togglePlanDay(id));

  return (
    <AppLayout activePath="/plan">
      <PageHeader
        eyebrow={t("plan.eyebrow")}
        title={t("plan.title")}
        description={t("plan.subtitle")}
        actions={
          <Button onClick={() => navigate("/new")} className="rounded-full">
            {t("plan.startNow")}<ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        }
      />

      {/* Progress */}
      <Card className="mb-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 label-eyebrow">
            <CalendarCheck className="h-4 w-4" />{t("plan.progress")}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{done} / {plan.length}</span>
        </div>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-foreground transition-smooth" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {/* Days */}
      <div className="space-y-3">
        {plan.map((d) => (
          <Card key={d.id} className={cn("p-5 transition-smooth", d.done && "bg-secondary/40")}>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => toggle(d.id)}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-smooth",
                  d.done ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/50",
                )}>
                {d.done ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="label-eyebrow">{t("plan.day", { day: d.day })}</span>
                  <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    <Target className="h-3 w-3" />{t(`skill.${d.abilityKey}`)}
                  </span>
                </div>
                <div className={cn("mt-1 text-base font-semibold", d.done && "text-muted-foreground line-through")}>
                  {t(d.themeKey)}
                </div>
                <div className="text-xs text-muted-foreground">{t(d.exerciseKey)}</div>
              </div>

              <Button variant={d.done ? "ghost" : "outline"} size="sm" className="rounded-full"
                onClick={() => navigate("/new")}>
                {t("plan.practice")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default TrainingPlan;
