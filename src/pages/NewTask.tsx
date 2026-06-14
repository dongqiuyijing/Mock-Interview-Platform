import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  JOB_DIRECTIONS, INTERVIEW_TYPES, DIFFICULTIES, DURATIONS,
  JobDirection, InterviewType, Difficulty, dirKey,
} from "@/lib/interview";

const NewTask = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [direction, setDirection] = useState<JobDirection>("ai_pm");
  const [interviewType, setInterviewType] = useState<InterviewType>("product");
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (jdText.trim().length < 30 || resumeText.trim().length < 30) {
      toast.error(t("new.error.short"));
      return;
    }
    setSubmitting(true);

    const { data: task, error } = await supabase
      .from("interview_tasks")
      .insert({
        user_id: user.id,
        job_title: jobTitle || t(dirKey(direction)),
        job_direction: direction,
        interview_type: interviewType,
        difficulty,
        duration,
        jd_text: jdText,
        resume_text: resumeText,
        status: "created",
      })
      .select()
      .single();

    if (error || !task) {
      setSubmitting(false);
      toast.error(t("new.error.create"));
      return;
    }

    // Trigger analysis (3 agents) then go to report page.
    const lang = localStorage.getItem("i18nextLng") ?? "zh-CN";
    const { error: fnError } = await supabase.functions.invoke("interview-agent", {
      body: { action: "analyze", taskId: task.id, lang },
    });

    setSubmitting(false);
    if (fnError) {
      toast.error(t("new.error.analyze"));
      navigate(`/tasks/${task.id}/report`);
      return;
    }
    navigate(`/tasks/${task.id}/report`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="container max-w-3xl flex-1 py-10">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back")}
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">{t("new.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("new.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Card className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t("new.jobTitle")}</Label>
              <Input id="title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t("new.jobTitle.ph")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd">{t("new.jd")}</Label>
              <Textarea id="jd" value={jdText} onChange={(e) => setJdText(e.target.value)}
                placeholder={t("new.jd.ph")} className="min-h-[160px] resize-y" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">{t("new.resume")}</Label>
              <Textarea id="resume" value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                placeholder={t("new.resume.ph")} className="min-h-[160px] resize-y" />
            </div>
          </Card>

          <Card className="grid gap-5 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("new.direction")}</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as JobDirection)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{t(d.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("new.type")}</Label>
              <Select value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVIEW_TYPES.map((it) => (
                    <SelectItem key={it.value} value={it.value}>{t(it.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("new.duration")}</Label>
              <RadioGroup
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
                className="flex gap-3"
              >
                {DURATIONS.map((d) => (
                  <label key={d} htmlFor={`dur-${d}`}
                    className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm transition-smooth has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem id={`dur-${d}`} value={String(d)} />
                    {t("new.duration.min", { min: d })}
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{t("new.difficulty")}</Label>
              <RadioGroup
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
                className="flex gap-3"
              >
                {DIFFICULTIES.map((d) => (
                  <label key={d.value} htmlFor={`diff-${d.value}`}
                    className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm transition-smooth has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <RadioGroupItem id={`diff-${d.value}`} value={d.value} />
                    {t(d.labelKey)}
                  </label>
                ))}
              </RadioGroup>
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full shadow-glow" disabled={submitting}>
            {submitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("new.submitting")}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />{t("new.submit")}</>
            )}
          </Button>
          {submitting && (
            <p className="text-center text-sm text-muted-foreground">{t("new.submitting.hint")}</p>
          )}
        </form>
      </main>
    </div>
  );
};

export default NewTask;
