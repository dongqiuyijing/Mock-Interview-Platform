import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ThumbsUp, ThumbsDown, AlertTriangle, MessageSquareText,
  Sparkles, ClipboardCheck, Copy, RotateCcw, Check, Target,
  ArrowRight, Loader2,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { StepHeader } from "@/components/StepHeader";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getFeedback } from "@/lib/api";
import { FeedbackReport } from "@/lib/interview";

const Feedback = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const [jobTitle, setJobTitle] = useState("");
  const [fb, setFb] = useState<FeedbackReport | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }
    (async () => {
      const f = await getFeedback(sessionId);
      if (!f) {
        navigate("/");
        return;
      }
      setFb(f);
      const { data: session } = await supabase
        .from("interview_sessions")
        .select("task_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (session) {
        const { data: tk } = await supabase
          .from("interview_tasks")
          .select("job_title")
          .eq("id", session.task_id)
          .maybeSingle();
        if (tk) setJobTitle(tk.job_title);
      }
      setLoading(false);
    })().catch(() => navigate("/"));
  }, [sessionId, navigate]);

  if (loading || !fb) {
    return (
      <AppLayout step="feedback" activePath="/new">
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("feedback.loading")}
        </div>
      </AppLayout>
    );
  }

  const grade = fb.summary?.grade ?? "—";
  const overview = fb.summary?.overview ?? "";
  const abilityScores = fb.ability_scores ?? [];
  const strengths = fb.strengths ?? [];
  const weaknesses = fb.weaknesses ?? [];
  const riskAnswers = fb.risk_answers ?? [];
  const questionFeedback = fb.question_feedback ?? [];
  const optimizedAnswers = fb.optimized_answers ?? [];
  const practicePlan = fb.practice_plan ?? [];

  const copy = (text: string, i: number) => {
    navigator.clipboard.writeText(text);
    setCopied(i);
    toast.success(t("feedback.copied"));
    setTimeout(() => setCopied(null), 1500);
  };

  const restart = () => navigate("/new");

  return (
    <AppLayout step="feedback" activePath="/new">
      <div className="grid gap-12 lg:grid-cols-[minmax(280px,360px)_1fr] lg:gap-16">
        {/* Left header + grade */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <StepHeader index={4} title={t("feedback.title")} description={jobTitle} />

          <div className="mt-8 border-t border-border pt-8">
            <div className="label-eyebrow mb-4">{t("feedback.grade")}</div>
            <div className="flex items-end gap-3">
              <span className="display text-7xl">{grade}</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{overview}</p>
          </div>

          <div className="mt-8 flex flex-col gap-2.5">
            <Button variant="ghost" size="sm" onClick={restart} className="rounded-full">
              <RotateCcw className="mr-2 h-4 w-4" />{t("feedback.restart")}
            </Button>
          </div>
        </div>

        {/* Right content */}
        <div className="space-y-8">
          {/* Top improvements highlight (from weaknesses) */}
          {weaknesses.length > 0 && (
            <Card className="bg-foreground p-7 text-background">
              <div className="mb-4 flex items-center gap-2 label-eyebrow text-background/70">
                <AlertTriangle className="h-4 w-4" />{t("feedback.topImprove")}
              </div>
              <ol className="space-y-3">
                {weaknesses.slice(0, 3).map((it, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-background/40 text-xs font-semibold">{i + 1}</span>
                    <span className="text-sm leading-relaxed">{it}</span>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {abilityScores.length > 0 && (
            <SectionCard icon={Sparkles} title={t("feedback.abilities")}>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={abilityScores} outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Radar dataKey="score" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.12} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <SectionCard icon={ThumbsUp} title={t("feedback.strengths")}>
              <BulletList items={strengths} marker="check" />
            </SectionCard>
            <SectionCard icon={ThumbsDown} title={t("feedback.weaknesses")}>
              <BulletList items={weaknesses} marker="warn" />
            </SectionCard>
            <SectionCard icon={AlertTriangle} title={t("feedback.risks")}>
              <BulletList items={riskAnswers} marker="risk" empty={t("feedback.noRisk")} />
            </SectionCard>
            <SectionCard icon={ClipboardCheck} title={t("feedback.practice")}>
              <BulletList items={practicePlan} marker="check" />
            </SectionCard>
          </div>

          {questionFeedback.length > 0 && (
            <SectionCard icon={MessageSquareText} title={t("feedback.perQuestion")}>
              <Accordion type="single" collapsible className="w-full">
                {questionFeedback.map((q, i) => (
                  <AccordionItem key={i} value={`q${i}`}>
                    <AccordionTrigger className="text-left text-sm">{q.question}</AccordionTrigger>
                    <AccordionContent className="space-y-5 pt-1">
                      <div>
                        <div className="label-eyebrow mb-2.5">{t("feedback.problems")}</div>
                        <BulletList items={q.problems ?? []} marker="warn" />
                      </div>
                      <div>
                        <div className="label-eyebrow mb-2.5">{t("feedback.direction")}</div>
                        <BulletList items={q.direction ?? []} marker="check" />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </SectionCard>
          )}

          {/* Optimized answers */}
          {optimizedAnswers.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 label-eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                {t("feedback.optimized")}
              </div>
              {optimizedAnswers.map((o, i) => (
                <Card key={i} className="p-7">
                  <div className="mb-3 text-sm font-medium">{o.question}</div>
                  <div className="whitespace-pre-wrap rounded-xl border border-border bg-secondary/50 p-5 text-sm leading-relaxed text-muted-foreground">
                    {o.answer}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => copy(o.answer, i)}>
                    {copied === i ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
                    {t("feedback.copy")}
                  </Button>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={restart} className="h-12 flex-1 rounded-full">
              <RotateCcw className="mr-2 h-4 w-4" />{t("feedback.newRound")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feedback;
