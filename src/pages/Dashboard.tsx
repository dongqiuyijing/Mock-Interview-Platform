import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PlusCircle, ArrowRight, TrendingUp, Target, History, CalendarCheck,
  Radar as RadarIcon, Sparkles, Video,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { SkillBars } from "@/components/SkillBars";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { store } from "@/lib/workspaceStore";
import { dirKey, typeKey } from "@/lib/interview";
import { formatDate } from "@/lib/format";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const sessions = useMemo(() => store.getSessions(), []);
  const skills = useMemo(() => store.getSkills(), []);
  const plan = useMemo(() => store.getPlan(), []);

  const last = sessions[0];
  const readiness = Math.round(skills.reduce((s, x) => s + x.current, 0) / skills.length);
  const weakest = [...skills].sort((a, b) => a.current - b.current).slice(0, 3);
  const todayTask = plan.find((p) => !p.done) ?? plan[0];

  return (
    <AppLayout>
      <PageHeader
        eyebrow={t("dash.eyebrow")}
        title={t("dash.title")}
        description={t("dash.subtitle")}
        actions={
          <Button onClick={() => navigate("/new")} className="rounded-full">
            <PlusCircle className="mr-2 h-4 w-4" />{t("dash.newInterview")}
          </Button>
        }
      />

      {/* Top metrics row */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Readiness */}
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2 label-eyebrow">
            <TrendingUp className="h-4 w-4" />{t("dash.readiness")}
          </div>
          <div className="flex items-end gap-2">
            <span className="display text-5xl">{readiness}</span>
            <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-foreground" style={{ width: `${readiness}%` }} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("dash.readiness.note")}</p>
        </Card>

        {/* Last performance */}
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2 label-eyebrow">
            <Target className="h-4 w-4" />{t("dash.lastPerf")}
          </div>
          {last ? (
            <>
              <div className="flex items-end justify-between">
                <span className="display text-5xl">{last.grade}</span>
                <span className="text-sm font-medium text-muted-foreground">{last.score}/100</span>
              </div>
              <div className="mt-3 truncate text-sm font-medium">{last.jobTitle}</div>
              <div className="text-xs text-muted-foreground">
                {t(typeKey(last.interviewType))} · {formatDate(last.date, i18n.language)}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dash.noData")}</p>
          )}
        </Card>

        {/* Today's training */}
        <Card className="flex flex-col bg-foreground p-6 text-background">
          <div className="mb-3 flex items-center gap-2 label-eyebrow text-background/70">
            <Sparkles className="h-4 w-4" />{t("dash.today")}
          </div>
          <div className="text-lg font-semibold">{t(todayTask.themeKey)}</div>
          <p className="mt-1 flex-1 text-sm text-background/70">{t(todayTask.exerciseKey)}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button variant="secondary" className="w-full rounded-full" onClick={() => navigate("/new?mode=video")}>
              <Video className="mr-2 h-4 w-4" />{t("dash.startVideo")}
            </Button>
            <Button variant="ghost" className="w-full rounded-full text-background hover:bg-background/10 hover:text-background" onClick={() => navigate("/new")}>
              {t("dash.startToday")}<ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Middle: weak tags + skills snapshot */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 label-eyebrow">
              <Target className="h-4 w-4" />{t("dash.toImprove")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakest.map((s) => (
              <span key={s.key} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                {t(`skill.${s.key}`)} · {s.current}
              </span>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-2 label-eyebrow">
              <CalendarCheck className="h-4 w-4" />{t("dash.recommend")}
            </div>
            <p className="mt-2 text-sm">{t(todayTask.themeKey)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t(todayTask.exerciseKey)}</p>
            <Button variant="link" className="mt-1 h-auto p-0 text-sm" onClick={() => navigate("/plan")}>
              {t("dash.viewPlan")}<ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2 label-eyebrow">
              <RadarIcon className="h-4 w-4" />{t("dash.skills")}
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/skills")}>
              {t("dash.viewAll")}<ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <SkillBars skills={skills.slice(0, 5)} />
        </Card>
      </div>

      {/* History */}
      <Card className="mt-5 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 label-eyebrow">
            <History className="h-4 w-4" />{t("dash.history")}
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
            {t("dash.viewAll")}<ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-2">
          {sessions.slice(0, 3).map((s) => (
            <button key={s.id} onClick={() => navigate("/history")}
              className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-smooth hover:border-foreground/40">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.jobTitle}</div>
                <div className="text-xs text-muted-foreground">
                  {t(dirKey(s.jobDirection))} · {formatDate(s.date, i18n.language)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold">{s.grade}</span>
                <span className="display text-xl tabular-nums">{s.score}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
};

export default Dashboard;
