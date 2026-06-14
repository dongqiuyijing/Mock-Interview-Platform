import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Briefcase, FileUser, GitCompareArrows, ListChecks, ArrowLeft, ArrowRight,
} from "lucide-react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { StepHeader } from "@/components/StepHeader";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { store, MockTask, MockAnalysis } from "@/lib/workspaceStore";
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

  const meta = [
    t(dirKey(task.jobDirection)),
    t(typeKey(task.interviewType)),
    t(difficultyKey(task.difficulty)),
    t("new.duration.min", { min: task.duration }),
  ];

  return (
    <WorkbenchLayout step="analysis">
      <div className="grid gap-12 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-20">
        {/* Left header */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <StepHeader index={2} title={t("report.title")} description={analysis.jd.positioning} />

          {/* Score block */}
          <div className="mt-10 border-t border-border pt-8">
            <div className="label-eyebrow mb-4">{t("report.matchScore")}</div>
            <div className="flex items-end gap-3">
              <span className="display text-6xl">{analysis.matchScore}</span>
              <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-foreground transition-smooth"
                style={{ width: `${analysis.matchScore}%` }} />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => navigate("/")}
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
                <Block label={t("report.jd.core")}><BulletList items={analysis.jd.coreResponsibilities} /></Block>
                <Block label={t("report.jd.must")}><BulletList items={analysis.jd.mustHave} marker="check" /></Block>
                <Block label={t("report.jd.ai")}>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.jd.aiFocus.map((f) => (
                      <span key={f} className="rounded-full border border-border px-2.5 py-1 text-xs">{f}</span>
                    ))}
                  </div>
                </Block>
                <Block label={t("report.jd.implicit")}><BulletList items={analysis.jd.implicit} marker="warn" /></Block>
              </div>
            </SectionCard>

            <SectionCard icon={FileUser} title={t("report.resume.title")}>
              <div className="space-y-5">
                <Block label={t("report.resume.sell")}><BulletList items={analysis.resume.sellingPoints} marker="check" /></Block>
                <Block label={t("report.resume.gap")}><BulletList items={analysis.resume.gaps} marker="warn" /></Block>
                <Block label={t("report.resume.probe")}><BulletList items={analysis.resume.probePoints} marker="risk" /></Block>
                <Block label={t("report.resume.evidence")}><BulletList items={analysis.resume.evidence} /></Block>
              </div>
            </SectionCard>

            <SectionCard icon={GitCompareArrows} title={t("report.match.title")}>
              <div className="space-y-5">
                <Block label={t("report.match.strong")}><BulletList items={analysis.strongMatches} marker="check" /></Block>
                <Block label={t("report.match.weak")}><BulletList items={analysis.weakMatches} marker="warn" /></Block>
                <Block label={t("report.match.risk")}><BulletList items={analysis.riskPoints} marker="risk" /></Block>
                <Block label={t("report.match.advice")}><BulletList items={analysis.advice} /></Block>
              </div>
            </SectionCard>

            <SectionCard icon={ListChecks} title={t("report.plan.title")}>
              <ol className="space-y-3">
                {analysis.plan.map((p, i) => (
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
            <Button onClick={startInterview} variant="secondary" size="lg" className="rounded-full">
              {t("report.cta.button")}<ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </WorkbenchLayout>
  );
};

const Block = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <div className="label-eyebrow mb-2.5">{label}</div>
    {children}
  </div>
);

export default Report;
