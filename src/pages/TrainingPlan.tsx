import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck, Check, Circle, ArrowRight, Target, Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserStats, AbilityStat } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DONE_KEY = "rr.planDone";

const readDone = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY) || "{}");
  } catch {
    return {};
  }
};

// Choose an exercise prompt based on how weak the ability is.
const exerciseKey = (score: number) =>
  score < 50 ? "plan.exercise.low" : score < 75 ? "plan.exercise.mid" : "plan.exercise.high";

const TrainingPlan = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [abilities, setAbilities] = useState<AbilityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Record<string, boolean>>(() => readDone());

  useEffect(() => {
    getUserStats()
      .then((s) => setAbilities(s.abilities))
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  // Weakest abilities first — that's what the user should train.
  const plan = useMemo(
    () => [...abilities].sort((a, b) => a.current - b.current).slice(0, 7),
    [abilities],
  );

  const completed = plan.filter((d) => done[d.name]).length;
  const progress = plan.length ? Math.round((completed / plan.length) * 100) : 0;

  const toggle = (name: string) => {
    setDone((prev) => {
      const next = { ...prev, [name]: !prev[name] };
      localStorage.setItem(DONE_KEY, JSON.stringify(next));
      return next;
    });
  };

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

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("plan.loading")}
        </div>
      ) : plan.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 p-14 text-center">
          <CalendarCheck className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-md text-sm text-muted-foreground">{t("plan.empty")}</p>
          <Button onClick={() => navigate("/new")} className="rounded-full">
            {t("plan.startNow")}<ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <>
          {/* Progress */}
          <Card className="mb-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 label-eyebrow">
                <CalendarCheck className="h-4 w-4" />{t("plan.progress")}
              </div>
              <span className="text-sm font-medium text-muted-foreground">{completed} / {plan.length}</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-foreground transition-smooth" style={{ width: `${progress}%` }} />
            </div>
          </Card>

          {/* Days */}
          <div className="space-y-3">
            {plan.map((d, i) => {
              const isDone = !!done[d.name];
              const target = Math.min(100, d.current + 15);
              return (
                <Card key={d.name} className={cn("p-5 transition-smooth", isDone && "bg-secondary/40")}>
                  <div className="flex flex-wrap items-center gap-4">
                    <button onClick={() => toggle(d.name)}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-smooth",
                        isDone ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/50",
                      )}>
                      {isDone ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="label-eyebrow">{t("plan.day", { day: i + 1 })}</span>
                        <span className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Target className="h-3 w-3" />{d.name}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t("plan.current", { score: d.current })}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
                          {t("plan.target", { score: target })}
                        </span>
                      </div>
                      <div className={cn("mt-1 text-sm leading-relaxed", isDone ? "text-muted-foreground line-through" : "text-foreground")}>
                        {t(exerciseKey(d.current), { ability: d.name })}
                      </div>
                    </div>

                    <Button variant={isDone ? "ghost" : "outline"} size="sm" className="rounded-full"
                      onClick={() => navigate("/new")}>
                      {t("plan.practice")}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </AppLayout>
  );
};

export default TrainingPlan;
