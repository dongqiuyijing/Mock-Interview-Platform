import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Briefcase, FileUser, GitCompareArrows, ListChecks, Play,
  ArrowLeft, TrendingUp,
} from "lucide-react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  store, MockTask, MockAnalysis,
} from "@/lib/workspaceStore";
import { dirKey, typeKey, difficultyKey } from "@/lib/interview";

const Report = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [task, setTask] = useState<MockTask | null>(null);
  const [analysis, setAnalysis] = useState<MockAnalysis | null>(null);

  useEffect(() => {
    const tk = store.getTask();
    const an = store.getAnalysis();
    if (!tk || !an) {
      navigate("/");
      return;
    }
    setTask(tk);
    setAnalysis(an);
  }, [navigate]);

  if (!task || !analysis) return null;

  const startInterview = () => {
    store.resetInterview();
    navigate("/interview");
  };

  const scoreTone =
    analysis.matchScore >= 75 ? "text-success" : analysis.matchScore >= 60 ? "text-primary" : "text-warning";

  return (
    <WorkbenchLayout step="analysis">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("report.title")}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{task.jobTitle}</span>
            <span>·</span>
            <Badge variant="secondary" className="font-normal">{t(dirKey(task.jobDirection))}</Badge>
            <Badge variant="secondary" className="font-normal">{t(typeKey(task.interviewType))}</Badge>
            <Badge variant="secondary" className="font-normal">{t(difficultyKey(task.difficulty))}</Badge>
            <Badge variant="secondary" className="font-normal">{t("new.duration.min", { min: task.duration })}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />{t("report.edit")}
        </Button>
      </div>

      {/* Score summary */}
      <Card className="mb-6 flex flex-col items-center gap-6 p-6 sm:flex-row">
        <div className="flex flex-col items-center justify-center rounded-xl bg-secondary px-8 py-5">
          <span className={`text-5xl font-bold ${scoreTone}`}>{analysis.matchScore}</span>
          <span className="mt-1 text-xs text-muted-foreground">{t("report.matchScore")}</span>
        </div>
        <div className="flex-1">
          <Progress value={analysis.matchScore} className="h-2" />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{analysis.jd.positioning}</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Briefcase} title={t("report.jd.title")} accent="primary">
          <div className="space-y-4">
            <Block label={t("report.jd.core")}><BulletList items={analysis.jd.coreResponsibilities} /></Block>
            <Block label={t("report.jd.must")}><BulletList items={analysis.jd.mustHave} marker="check" /></Block>
            <Block label={t("report.jd.ai")}>
              <div className="flex flex-wrap gap-1.5">
                {analysis.jd.aiFocus.map((f) => <Badge key={f} variant="outline" className="font-normal">{f}</Badge>)}
              </div>
            </Block>
            <Block label={t("report.jd.implicit")}><BulletList items={analysis.jd.implicit} marker="warn" /></Block>
          </div>
        </SectionCard>

        <SectionCard icon={FileUser} title={t("report.resume.title")} accent="accent">
          <div className="space-y-4">
            <Block label={t("report.resume.sell")}><BulletList items={analysis.resume.sellingPoints} marker="check" /></Block>
            <Block label={t("report.resume.gap")}><BulletList items={analysis.resume.gaps} marker="warn" /></Block>
            <Block label={t("report.resume.probe")}><BulletList items={analysis.resume.probePoints} marker="risk" /></Block>
            <Block label={t("report.resume.evidence")}><BulletList items={analysis.resume.evidence} /></Block>
          </div>
        </SectionCard>

        <SectionCard icon={GitCompareArrows} title={t("report.match.title")} accent="success">
          <div className="space-y-4">
            <Block label={t("report.match.strong")}><BulletList items={analysis.strongMatches} marker="check" /></Block>
            <Block label={t("report.match.weak")}><BulletList items={analysis.weakMatches} marker="warn" /></Block>
            <Block label={t("report.match.risk")}><BulletList items={analysis.riskPoints} marker="risk" /></Block>
            <Block label={t("report.match.advice")}><BulletList items={analysis.advice} /></Block>
          </div>
        </SectionCard>

        <SectionCard icon={ListChecks} title={t("report.plan.title")} accent="primary">
          <ol className="space-y-3">
            {analysis.plan.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-border p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">{i + 1}</span>
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

      {/* Start interview CTA */}
      <Card className="mt-6 flex flex-col items-center justify-between gap-4 border-primary/30 bg-primary-soft p-6 sm:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">{t("report.cta.title")}</div>
            <div className="text-sm text-muted-foreground">{t("report.cta.desc")}</div>
          </div>
        </div>
        <Button size="lg" onClick={startInterview}>
          <Play className="mr-2 h-4 w-4" />{t("report.cta.button")}
        </Button>
      </Card>
    </WorkbenchLayout>
  );
};

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
    {children}
  </div>
);

export default Report;
