import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ThumbsUp, ThumbsDown, AlertTriangle, MessageSquareText,
  Sparkles, ClipboardCheck, Copy, RotateCcw, Check,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { StepHeader } from "@/components/StepHeader";
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
      <div className="grid gap-12 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-20">
        {/* Left header + grade */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <StepHeader index={4} title={t("feedback.title")} description={task.jobTitle} />

          <div className="mt-10 border-t border-border pt-8">
            <div className="label-eyebrow mb-4">{t("feedback.grade")}</div>
            <span className="display text-7xl">{fb.grade}</span>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{fb.overview}</p>
          </div>

          <Button variant="outline" size="sm" onClick={restart} className="mt-8 rounded-full">
            <RotateCcw className="mr-2 h-4 w-4" />{t("feedback.restart")}
          </Button>
        </div>

        {/* Right content */}
        <div className="space-y-8">
          <SectionCard icon={Sparkles} title={t("feedback.abilities")}>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={fb.abilityScores} outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.12} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard icon={ThumbsUp} title={t("feedback.strengths")}>
              <BulletList items={fb.strengths} marker="check" />
            </SectionCard>
            <SectionCard icon={ThumbsDown} title={t("feedback.weaknesses")}>
              <BulletList items={fb.weaknesses} marker="warn" />
            </SectionCard>
            <SectionCard icon={AlertTriangle} title={t("feedback.risks")}>
              <BulletList items={fb.riskAnswers} marker="risk" empty={t("feedback.noRisk")} />
            </SectionCard>
            <SectionCard icon={ClipboardCheck} title={t("feedback.practice")}>
              <BulletList items={fb.practicePlan} marker="check" />
            </SectionCard>
          </div>

          <SectionCard icon={MessageSquareText} title={t("feedback.perQuestion")}>
            <Accordion type="single" collapsible className="w-full">
              {fb.questionFeedback.map((q, i) => (
                <AccordionItem key={i} value={`q${i}`}>
                  <AccordionTrigger className="text-left text-sm">{q.question}</AccordionTrigger>
                  <AccordionContent className="space-y-5 pt-1">
                    <div>
                      <div className="label-eyebrow mb-2.5">{t("feedback.problems")}</div>
                      <BulletList items={q.problems} marker="warn" />
                    </div>
                    <div>
                      <div className="label-eyebrow mb-2.5">{t("feedback.direction")}</div>
                      <BulletList items={q.direction} marker="check" />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionCard>

          {/* Optimized answers */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 label-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              {t("feedback.optimized")}
            </div>
            {fb.optimizedAnswers.map((o, i) => (
              <Card key={i} className="p-7">
                <div className="mb-3 text-sm font-medium">{o.question}</div>
                <div className="rounded-xl border border-border bg-secondary/50 p-5 text-sm leading-relaxed text-muted-foreground">
                  {o.answer}
                </div>
                <Button variant="ghost" size="sm" className="mt-3" onClick={() => copy(o.answer, i)}>
                  {copied === i ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
                  {t("feedback.copy")}
                </Button>
              </Card>
            ))}
          </div>

          <Button size="lg" onClick={restart} className="h-12 w-full rounded-full">
            <RotateCcw className="mr-2 h-4 w-4" />{t("feedback.newRound")}
          </Button>
        </div>
      </div>
    </WorkbenchLayout>
  );
};

export default Feedback;
