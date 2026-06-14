import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Loader2, Award, Gauge, ThumbsUp, ThumbsDown,
  ShieldAlert, MessageSquareText, Sparkles, ListTodo, Copy,
} from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { SectionCard, BulletList } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import { FeedbackReport, InterviewSession } from "@/lib/interview";

const Feedback = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = localStorage.getItem("i18nextLng") ?? "zh-CN";

  const [report, setReport] = useState<FeedbackReport | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: sess } = await supabase
        .from("interview_sessions").select("*").eq("id", id).maybeSingle();
      setSession(sess as InterviewSession);
      const { data } = await supabase
        .from("feedback_reports").select("*").eq("session_id", id).maybeSingle();
      if (data) {
        setReport(data as FeedbackReport);
        setLoading(false);
        return;
      }
      // generate if missing
      setGenerating(true);
      const { error } = await supabase.functions.invoke("interview-agent", {
        body: { action: "finish", sessionId: id, lang },
      });
      if (!error) {
        const { data: fresh } = await supabase
          .from("feedback_reports").select("*").eq("session_id", id).maybeSingle();
        setReport(fresh as FeedbackReport);
      } else {
        toast.error(t("feedback.error"));
      }
      setGenerating(false);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("feedback.copied"));
  };

  if (loading || generating) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("feedback.generating")}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">{t("feedback.notfound")}</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard")}>{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  const radarData = (report.ability_scores ?? []).map((s) => ({
    name: s.name, score: s.score,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container max-w-5xl flex-1 py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>

        {/* Overall */}
        <Card className="overflow-hidden gradient-hero p-8 shadow-elegant">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15 backdrop-blur">
              <Award className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-primary-foreground/80">{t("feedback.grade")}</div>
              <div className="text-4xl font-bold text-primary-foreground">
                {report.summary?.grade ?? "—"}
              </div>
              {report.summary?.overview && (
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/90">
                  {report.summary.overview}
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Ability scores radar */}
          <SectionCard icon={Gauge} title={t("feedback.abilities")} accent="primary">
            {radarData.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="70%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar dataKey="score" stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
            <div className="mt-2 space-y-2">
              {radarData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold">{s.score}/10</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Strengths / weaknesses */}
          <div className="space-y-6">
            <SectionCard icon={ThumbsUp} title={t("feedback.strengths")} accent="success">
              <BulletList items={report.strengths} marker="check" />
            </SectionCard>
            <SectionCard icon={ThumbsDown} title={t("feedback.weaknesses")} accent="warning">
              <BulletList items={report.weaknesses} marker="warn" />
            </SectionCard>
          </div>
        </div>

        {/* Risk answers */}
        {report.risk_answers && report.risk_answers.length > 0 && (
          <div className="mt-6">
            <SectionCard icon={ShieldAlert} title={t("feedback.risks")} accent="destructive">
              <BulletList items={report.risk_answers} marker="risk" />
            </SectionCard>
          </div>
        )}

        {/* Per-question feedback */}
        {report.question_feedback && report.question_feedback.length > 0 && (
          <div className="mt-6">
            <SectionCard icon={MessageSquareText} title={t("feedback.perQuestion")} accent="primary">
              <Accordion type="single" collapsible className="w-full">
                {report.question_feedback.map((q, i) => (
                  <AccordionItem key={i} value={`q-${i}`}>
                    <AccordionTrigger className="text-left text-sm">{q.question}</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-warning">{t("feedback.problems")}</h4>
                        <BulletList items={q.problems} marker="warn" />
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-success">{t("feedback.direction")}</h4>
                        <BulletList items={q.direction} marker="check" />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </SectionCard>
          </div>
        )}

        {/* Optimized answers */}
        {report.optimized_answers && report.optimized_answers.length > 0 && (
          <div className="mt-6">
            <SectionCard icon={Sparkles} title={t("feedback.optimized")} accent="accent">
              <div className="space-y-4">
                {report.optimized_answers.map((o, i) => (
                  <Card key={i} className="bg-muted/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{o.question}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0"
                        onClick={() => copyAnswer(o.answer)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {o.answer}
                    </p>
                  </Card>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* Practice plan */}
        {report.practice_plan && report.practice_plan.length > 0 && (
          <div className="mt-6">
            <SectionCard icon={ListTodo} title={t("feedback.practice")} accent="primary">
              <BulletList items={report.practice_plan} marker="dot" />
            </SectionCard>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {session && (
            <Button variant="outline" onClick={() => navigate(`/tasks/${session.task_id}/report`)}>
              {t("feedback.backToReport")}
            </Button>
          )}
          <Button onClick={() => navigate("/dashboard")}>{t("feedback.toDashboard")}</Button>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
