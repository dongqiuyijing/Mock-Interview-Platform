import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Briefcase, FileUser, GitCompareArrows, ListChecks, ArrowLeft, ArrowRight, Loader2,
  MessageSquareText, Video,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { StepHeader } from "@/components/StepHeader";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTask, getAnalysis, createSession } from "@/lib/api";
import { InterviewTask, AnalysisReport, dirLabel, typeKey, difficultyKey } from "@/lib/interview";
import { toast } from "sonner";

const Report = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const taskId = params.get("taskId");
  const [task, setTask] = useState<InterviewTask | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!taskId) {
      navigate("/");
      return;
    }
    Promise.all([getTask(taskId), getAnalysis(taskId)])
      .then(([tk, an]) => {
        if (!tk || !an) {
          navigate("/");
          return;
        }
        setTask(tk as InterviewTask);
        setAnalysis(an);
      })
      .catch(() => navigate("/"));
  }, [taskId, navigate]);

  if (!task || !analysis) {
    return (
      <AppLayout step="analysis" activePath="/new">
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("report.loading")}
        </div>
      </AppLayout>
    );
  }

  const jd = analysis.jd_analysis ?? {};
  const resume = analysis.resume_analysis ?? {};
  const plan = analysis.interview_plan?.plan ?? [];
  const advice = analysis.interview_plan?.advice ?? [];
  const score = analysis.match_score ?? 0;

  const startInterview = async (mode: "text" | "video") => {
    setStarting(true);
    try {
      const sessionId = await createSession(task.id, mode, i18n.language);
      navigate(`${mode === "video" ? "/video-interview" : "/interview"}?sessionId=${sessionId}`);
    } catch (err) {
      toast.error((err as Error).message);
      setStarting(false);
    }
  };

  const meta = [
    dirLabel(task.job_direction, t),
    t(typeKey(task.interview_type)),
    t(difficultyKey(task.difficulty)),
    t("new.duration.min", { min: task.duration }),
  ];

  return (
    <AppLayout step="analysis" activePath="/new">
      <div className="grid gap-12 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-20">
        {/* Left header */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <StepHeader index={2} title={t("report.title")} description={jd.positioning} />

          {/* Score block */}
          <div className="mt-10 border-t border-border pt-8">
            <div className="label-eyebrow mb-4">{t("report.matchScore")}</div>
            <div className="flex items-end gap-3">
              <span className="display text-6xl">{score}</span>
              <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-foreground transition-smooth"
                style={{ width: `${score}%` }} />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate("/new")}
            className="mt-8 rounded-full">
            <ArrowLeft className="mr-2 h-4 w-4" />{t("report.edit")}
          </Button>
        </div>

        {/* Right content */}
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            {meta.map((m) => (
              <span key={m} className="rounded-full border border-border px-3 py-1 text-xs font-medium">{m}</span>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard icon={Briefcase} title={t("report.jd.title")}>
              <div className="space-y-5">
                <Block label={t("report.jd.core")}><BulletList items={jd.core_responsibilities ?? []} /></Block>
                <Block label={t("report.jd.must")}><BulletList items={jd.must_have ?? []} marker="check" /></Block>
                <Block label={t("report.jd.ai")}>
                  <div className="flex flex-wrap gap-1.5">
                    {(jd.ai_focus_points ?? []).map((f) => (
                      <span key={f} className="rounded-full border border-border px-2.5 py-1 text-xs">{f}</span>
                    ))}
                  </div>
                </Block>
                <Block label={t("report.jd.implicit")}><BulletList items={jd.implicit_requirements ?? []} marker="warn" /></Block>
              </div>
            </SectionCard>

            <SectionCard icon={FileUser} title={t("report.resume.title")}>
              <div className="space-y-5">
                <Block label={t("report.resume.sell")}><BulletList items={resume.selling_points ?? []} marker="check" /></Block>
                <Block label={t("report.resume.gap")}><BulletList items={resume.gaps ?? []} marker="warn" /></Block>
                <Block label={t("report.resume.probe")}><BulletList items={resume.probe_points ?? []} marker="risk" /></Block>
                <Block label={t("report.resume.evidence")}><BulletList items={resume.evidence_to_prepare ?? []} /></Block>
              </div>
            </SectionCard>

            <SectionCard icon={GitCompareArrows} title={t("report.match.title")}>
              <div className="space-y-5">
                <Block label={t("report.match.strong")}><BulletList items={analysis.strong_matches ?? []} marker="check" /></Block>
                <Block label={t("report.match.weak")}><BulletList items={analysis.weak_matches ?? []} marker="warn" /></Block>
                <Block label={t("report.match.risk")}><BulletList items={analysis.risk_points ?? []} marker="risk" /></Block>
                <Block label={t("report.match.advice")}><BulletList items={advice} /></Block>
              </div>
            </SectionCard>

            <SectionCard icon={ListChecks} title={t("report.plan.title")}>
              <ol className="space-y-3">
                {plan.map((p, i) => (
                  <li key={i} className="flex gap-3 rounded-xl border border-border p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-foreground/70 text-xs font-semibold">{i + 1}</span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {p.stage}
                        <span className="text-xs font-normal text-muted-foreground">{t("new.duration.min", { min: p.minutes })}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{p.focus}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </SectionCard>
          </div>

          {/* CTA */}
          <Card className="flex flex-col items-start justify-between gap-5 bg-foreground p-7 text-background sm:flex-row sm:items-center">
            <div>
              <div className="text-lg font-semibold">{t("report.cta.title")}</div>
              <div className="mt-1 text-sm text-background/70">{t("report.cta.desc")}</div>
            </div>
            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
              <Button onClick={() => startInterview("text")} disabled={starting} variant="outline" size="lg"
                className="rounded-full border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background">
                {starting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <MessageSquareText className="mr-2 h-4 w-4" />{t("report.cta.text")}
              </Button>
              <Button onClick={() => startInterview("video")} disabled={starting} variant="secondary" size="lg" className="rounded-full">
                {starting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Video className="mr-2 h-4 w-4" />{t("report.cta.video")}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="label-eyebrow mb-2.5">{label}</div>
    {children}
  </div>
);

export default Report;
