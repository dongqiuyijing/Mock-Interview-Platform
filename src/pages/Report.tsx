import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Target, FileUser, GitCompare, ListChecks, Loader2,
  Play, CheckCircle2, AlertTriangle, ShieldAlert, Lightbulb, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { InterviewTask, AnalysisReport, dirKey, typeKey, difficultyKey } from "@/lib/interview";

const Report = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState<InterviewTask | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [starting, setStarting] = useState(false);

  const lang = localStorage.getItem("i18nextLng") ?? "zh-CN";

  const load = useCallback(async () => {
    if (!id) return;
    const [{ data: taskData }, { data: reportData }] = await Promise.all([
      supabase.from("interview_tasks").select("*").eq("id", id).maybeSingle(),
      supabase.from("analysis_reports").select("*").eq("task_id", id)
        .order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setTask(taskData as InterviewTask | null);
    setReport(reportData as AnalysisReport | null);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runAnalysis = async () => {
    if (!id) return;
    setAnalyzing(true);
    const { error } = await supabase.functions.invoke("interview-agent", {
      body: { action: "analyze", taskId: id, lang },
    });
    if (error) {
      toast.error(t("report.error.analyze"));
    } else {
      await load();
      toast.success(t("report.success.analyze"));
    }
    setAnalyzing(false);
  };

  const startInterview = async () => {
    if (!id || !user) return;
    setStarting(true);
    const { data: session, error } = await supabase
      .from("interview_sessions")
      .insert({ task_id: id, user_id: user.id, status: "active" })
      .select()
      .single();
    if (error || !session) {
      setStarting(false);
      toast.error(t("report.error.start"));
      return;
    }
    await supabase.from("interview_tasks")
      .update({ status: "interviewing" }).eq("id", id);
    navigate(`/sessions/${session.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">{t("report.notfound")}</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  const jd = report?.jd_analysis;
  const resume = report?.resume_analysis;
  const plan = report?.interview_plan?.plan ?? [];
  const score = report?.match_score ?? 0;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container max-w-5xl flex-1 py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>

        {/* Header summary */}
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{task.job_title}</h1>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{t(dirKey(task.job_direction))}</Badge>
                <Badge variant="secondary">{t(typeKey(task.interview_type))}</Badge>
                <Badge variant="secondary">{t("new.duration.min", { min: task.duration })}</Badge>
                <Badge variant={task.difficulty === "stress" ? "destructive" : "outline"}>
                  {t(difficultyKey(task.difficulty))}
                </Badge>
              </div>
            </div>
            {report && (
              <div className="text-center">
                <div className="text-4xl font-bold text-gradient">{score}</div>
                <div className="text-xs text-muted-foreground">{t("report.matchScore")}</div>
              </div>
            )}
          </div>
        </Card>

        {!report ? (
          <Card className="mt-6 flex flex-col items-center justify-center py-16 text-center">
            {analyzing ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{t("report.analyzing.title")}</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {t("report.analyzing.desc")}
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{t("report.pending.title")}</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("report.pending.desc")}</p>
                <Button className="mt-6" onClick={runAnalysis}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t("report.generate")}
                </Button>
              </>
            )}
          </Card>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Module 1: JD analysis */}
            <SectionCard icon={Target} title={t("report.jd.title")} accent="primary">
              {jd?.positioning && (
                <div className="mb-5 rounded-lg bg-primary/5 p-4 text-sm leading-relaxed">
                  {jd.positioning}
                </div>
              )}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.jd.core")}</h4>
                  <BulletList items={jd?.core_responsibilities} />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.jd.must")}</h4>
                  <BulletList items={jd?.must_have} marker="check" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.jd.nice")}</h4>
                  <BulletList items={jd?.nice_to_have} />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.jd.ai")}</h4>
                  <BulletList items={jd?.ai_focus_points} marker="warn" />
                </div>
              </div>
              {jd?.implicit_requirements && jd.implicit_requirements.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.jd.implicit")}</h4>
                  <BulletList items={jd.implicit_requirements} />
                </>
              )}
            </SectionCard>

            {/* Module 2: Resume analysis */}
            <SectionCard icon={FileUser} title={t("report.resume.title")} accent="accent">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.resume.selling")}</h4>
                  <BulletList items={resume?.selling_points} marker="check" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.resume.matched")}</h4>
                  <BulletList items={resume?.matched_experience} marker="check" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.resume.gaps")}</h4>
                  <BulletList items={resume?.gaps} marker="warn" />
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.resume.probe")}</h4>
                  <BulletList items={resume?.probe_points} marker="risk" />
                </div>
              </div>
              {resume?.evidence_to_prepare && resume.evidence_to_prepare.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">{t("report.resume.evidence")}</h4>
                  <BulletList items={resume.evidence_to_prepare} marker="dot" />
                </>
              )}
            </SectionCard>

            {/* Module 3: Match */}
            <SectionCard icon={GitCompare} title={t("report.match.title")} accent="success">
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{t("report.matchScore")}</span>
                  <span className="font-bold">{score}/100</span>
                </div>
                <Progress value={score} className="h-2.5" />
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success">
                    <CheckCircle2 className="h-4 w-4" />{t("report.match.strong")}
                  </h4>
                  <BulletList items={report.strong_matches} marker="check" />
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-warning">
                    <AlertTriangle className="h-4 w-4" />{t("report.match.weak")}
                  </h4>
                  <BulletList items={report.weak_matches} marker="warn" />
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-destructive">
                    <ShieldAlert className="h-4 w-4" />{t("report.match.risk")}
                  </h4>
                  <BulletList items={report.risk_points} marker="risk" />
                </div>
              </div>
              {report.interview_plan?.advice && report.interview_plan.advice.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <Lightbulb className="h-4 w-4" />{t("report.match.advice")}
                  </h4>
                  <BulletList items={report.interview_plan.advice} />
                </>
              )}
            </SectionCard>

            {/* Module 4: Interview plan */}
            <SectionCard icon={ListChecks} title={t("report.plan.title")} accent="primary">
              <ol className="space-y-3">
                {plan.map((p, i) => (
                  <li key={i} className="flex gap-4 rounded-lg border border-border p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{p.stage}</span>
                        {p.minutes ? (
                          <Badge variant="outline" className="shrink-0">{t("new.duration.min", { min: p.minutes })}</Badge>
                        ) : null}
                      </div>
                      {p.focus && <p className="mt-1 text-sm text-muted-foreground">{p.focus}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>

            {/* Module 5: Start interview */}
            <Card className="flex flex-col items-center gap-4 gradient-hero p-8 text-center shadow-elegant sm:flex-row sm:text-left">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-primary-foreground">{t("report.start.title")}</h3>
                <p className="mt-1 text-sm text-primary-foreground/85">{t("report.start.desc")}</p>
              </div>
              <Button size="lg" variant="secondary" onClick={startInterview} disabled={starting}>
                {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                {t("report.start.btn")}
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Report;
