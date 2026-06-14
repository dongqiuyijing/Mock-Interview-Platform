import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PlusCircle, ArrowRight, TrendingUp, Target, History, Sparkles,
  Radar as RadarIcon, Video, Loader2, Rocket,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getUserStats, UserStats } from "@/lib/api";
import { dirLabel, typeKey } from "@/lib/interview";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserStats()
      .then(setStats)
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("dash.loading")}
        </div>
      </AppLayout>
    );
  }

  const sessions = stats?.sessions ?? [];
  const isEmpty = sessions.length === 0;

  // ---- Empty state for brand-new users ----
  if (isEmpty) {
    return (
      <AppLayout>
        <PageHeader
          eyebrow={t("dash.eyebrow")}
          title={t("dash.title")}
          description={t("dash.subtitle")}
        />
        <Card className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Rocket className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t("dash.empty.title")}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t("dash.empty.desc")}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button onClick={() => navigate("/new")} size="lg" className="rounded-full">
              <PlusCircle className="mr-2 h-4 w-4" />{t("dash.empty.cta")}
            </Button>
            <Button onClick={() => navigate("/new?mode=video")} size="lg" variant="outline" className="rounded-full">
              <Video className="mr-2 h-4 w-4" />{t("dash.startVideo")}
            </Button>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const last = sessions[0];
  const readiness = stats?.readiness ?? 0;
  const improvement = stats?.improvement;
  const weakest = [...(stats?.abilities ?? [])]
    .sort((a, b) => a.current - b.current)
    .slice(0, 3);

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
          <p className="mt-3 text-xs text-muted-foreground">
            {improvement != null
              ? t("dash.readiness.change", {
                  sign: improvement >= 0 ? "+" : "",
                  value: improvement,
                })
              : t("dash.readiness.note")}
          </p>
        </Card>

        {/* Last performance */}
        <Card className="p-6">
          <div className="mb-3 flex items-center gap-2 label-eyebrow">
            <Target className="h-4 w-4" />{t("dash.lastPerf")}
          </div>
          <div className="flex items-end justify-between">
            <span className="display text-5xl">{last.grade}</span>
            <span className="text-sm font-medium text-muted-foreground">{last.score}/100</span>
          </div>
          <div className="mt-3 truncate text-sm font-medium">{last.jobTitle}</div>
          <div className="text-xs text-muted-foreground">
            {t(typeKey(last.interviewType))} · {formatDate(last.date, i18n.language)}
          </div>
        </Card>

        {/* Recommended next practice */}
        <Card className="flex flex-col bg-foreground p-6 text-background">
          <div className="mb-3 flex items-center gap-2 label-eyebrow text-background/70">
            <Sparkles className="h-4 w-4" />{t("dash.today")}
          </div>
          <div className="text-lg font-semibold">{t("dash.nextPractice")}</div>
          <p className="mt-1 flex-1 text-sm text-background/70">
            {weakest.length
              ? t("dash.nextPractice.focus", { skill: weakest[0].name })
              : t("dash.nextPractice.desc")}
          </p>
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

      {/* Middle: abilities to improve + skills snapshot */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2 label-eyebrow">
            <Target className="h-4 w-4" />{t("dash.toImprove")}
          </div>
          {weakest.length ? (
            <div className="flex flex-wrap gap-2">
              {weakest.map((s) => (
                <span key={s.name} className="rounded-full border border-border px-3 py-1.5 text-xs font-medium">
                  {s.name} · {s.current}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dash.noAbilities")}</p>
          )}
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
          <div className="space-y-3">
            {(stats?.abilities ?? []).slice(0, 5).map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{s.name}</span>
                  <span className="tabular-nums text-muted-foreground">{s.current}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${s.current}%` }} />
                </div>
              </div>
            ))}
          </div>
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
            <button key={s.sessionId} onClick={() => navigate(`/feedback?sessionId=${s.sessionId}`)}
              className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-smooth hover:border-foreground/40">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{s.jobTitle}</div>
                <div className="text-xs text-muted-foreground">
                  {dirLabel(s.jobDirection, t)} · {formatDate(s.date, i18n.language)}
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
