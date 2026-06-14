import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Award, ThumbsUp, ThumbsDown, AlertTriangle, MessageSquareText,
  Sparkles, ClipboardCheck, Copy, RotateCcw, Check,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { store, MockTask, MockFeedback } from "@/lib/workspaceStore";

const Feedback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [task, setTask] = useState<MockTask | null>(null);
  const [fb, setFb] = useState<MockFeedback | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const tk = store.getTask();
    const f = store.getFeedback();
    if (!tk || !f) {
      navigate("/");
      return;
    }
    setTask(tk);
    setFb(f);
  }, [navigate]);

  if (!task || !fb) return null;

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    toast.success(t("feedback.copied"));
    setTimeout(() => setCopied(null), 1500);
  };

  const restart = () => {
    store.clearAll();
    navigate("/");
  };

  return (
    <WorkbenchLayout step="feedback">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("feedback.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{task.jobTitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw className="mr-2 h-4 w-4" />{t("feedback.restart")}
        </Button>
      </div>

      {/* Overview */}
      <Card className="mb-6 grid gap-6 p-6 md:grid-cols-[200px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-xl bg-secondary py-6">
          <Award className="mb-2 h-6 w-6 text-primary" />
          <span className="text-5xl font-bold text-primary">{fb.grade}</span>
          <span className="mt-1 text-xs text-muted-foreground">{t("feedback.grade")}</span>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">{t("feedback.overview")}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{fb.overview}</p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard icon={Sparkles} title={t("feedback.abilities")} accent="primary">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={fb.abilityScores} outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard icon={ThumbsUp} title={t("feedback.strengths")} accent="success">
            <BulletList items={fb.strengths} marker="check" />
          </SectionCard>
          <SectionCard icon={ThumbsDown} title={t("feedback.weaknesses")} accent="warning">
            <BulletList items={fb.weaknesses} marker="warn" />
          </SectionCard>
        </div>

        <SectionCard icon={AlertTriangle} title={t("feedback.risks")} accent="destructive">
          <BulletList items={fb.riskAnswers} marker="risk" empty={t("feedback.noRisk")} />
        </SectionCard>

        <SectionCard icon={ClipboardCheck} title={t("feedback.practice")} accent="accent">
          <BulletList items={fb.practicePlan} marker="check" />
        </SectionCard>
      </div>

      {/* Per question */}
      <SectionCard icon={MessageSquareText} title={t("feedback.perQuestion")} accent="primary">
        <Accordion type="single" collapsible className="w-full">
          {fb.questionFeedback.map((q, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left text-sm">{q.question}</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-warning">{t("feedback.problems")}</div>
                  <BulletList items={q.problems} marker="warn" />
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">{t("feedback.direction")}</div>
                  <BulletList items={q.direction} marker="check" />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SectionCard>

      {/* Optimized answers */}
      <div className="mt-6 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-accent" />{t("feedback.optimized")}
        </h3>
        {fb.optimizedAnswers.map((o, i) => (
          <Card key={i} className="p-5">
            <div className="mb-2 text-sm font-medium">{o.question}</div>
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
              {o.answer}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => copy(o.answer, i)}>
              {copied === i ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
              {t("feedback.copy")}
            </Button>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <Button size="lg" onClick={restart}>
          <RotateCcw className="mr-2 h-4 w-4" />{t("feedback.newRound")}
        </Button>
      </div>
    </WorkbenchLayout>
  );
};

export default Feedback;
