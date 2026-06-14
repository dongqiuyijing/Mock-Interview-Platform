import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText, FileUser, ArrowRight, Sparkles, Target, ListChecks, CircleCheck,
  MessageSquareText, Video,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  JOB_DIRECTIONS, INTERVIEW_TYPES, DIFFICULTIES, DURATIONS, INTERVIEW_MODES,
  JobDirection, InterviewType, Difficulty, InterviewMode, dirKey,
} from "@/lib/interview";
import { createTask, analyzeTask } from "@/lib/api";
import { cn } from "@/lib/utils";

const SAMPLE_JD = `We are hiring an AI Product Manager to own our LLM-powered assistant. You will define the roadmap, design evaluation metrics for answer quality, partner with engineering on RAG and agent workflows, and balance latency, cost and reliability. Experience shipping AI features to production required.`;
const SAMPLE_RESUME = `Product Manager with 4 years experience. Shipped a customer-support assistant using retrieval-augmented generation, improving deflection by 28%. Built an eval harness with human + automated scoring. Partnered with ML engineers on prompt iteration and cost optimization.`;

const NewTask = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [jobTitle, setJobTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [direction, setDirection] = useState<JobDirection>("ai_pm");
  const [interviewType, setInterviewType] = useState<InterviewType>("product");
  const [mode, setMode] = useState<InterviewMode>(
    searchParams.get("mode") === "video" ? "video" : "text",
  );
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [submitting, setSubmitting] = useState(false);

  const fillSample = () => {
    setJobTitle("Senior AI Product Manager");
    setJdText(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jdText.trim().length < 30 || resumeText.trim().length < 30) {
      toast.error(t("new.error.short"));
      return;
    }
    setSubmitting(true);
    try {
      const taskId = await createTask({
        jobTitle: jobTitle || t(dirKey(direction)),
        jobDirection: direction,
        interviewType,
        difficulty,
        duration,
        jdText,
        resumeText,
        mode,
      });
      await analyzeTask(taskId, i18n.language);
      navigate(`/analysis?taskId=${taskId}`);
    } catch (err) {
      toast.error((err as Error).message ?? t("new.error.short"));
      setSubmitting(false);
    }
  };

  const previewItems = [
    { icon: Target, key: "role" },
    { icon: FileUser, key: "resume" },
    { icon: ListChecks, key: "plan" },
    { icon: Sparkles, key: "feedback" },
  ];

  return (
    <AppLayout step="create" activePath="/new">
      {/* Page heading */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/80 text-sm font-semibold">
            01
          </span>
          <div>
            <div className="label-eyebrow mb-2">{t("step.indexLabel", { index: 1, total: 4 })}</div>
            <h1 className="display text-3xl sm:text-4xl">{t("new.title")}</h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              {t("new.subtitle")}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={fillSample} className="rounded-full">
          <Sparkles className="mr-2 h-4 w-4" />{t("new.useSample")}
        </Button>
      </div>

      {/* Two-column working layout */}
      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-12">
        {/* Left: form */}
        <form onSubmit={handleSubmit} className="min-w-0 space-y-8">
          <Card className="p-8">
            <div className="label-eyebrow mb-7">{t("new.inputs.title")}</div>
            <div className="space-y-7">
              <Field label={t("new.jobTitle")}>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                  placeholder={t("new.jobTitle.ph")}
                  className="h-11 rounded-xl border-border" />
              </Field>

              <Field label={t("new.jd")} icon={FileText}>
                <Textarea value={jdText} onChange={(e) => setJdText(e.target.value)}
                  placeholder={t("new.jd.ph")}
                  className="min-h-[150px] resize-y rounded-xl border-border" />
              </Field>

              <Field label={t("new.resume")} icon={FileUser}>
                <Textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                  placeholder={t("new.resume.ph")}
                  className="min-h-[150px] resize-y rounded-xl border-border" />
              </Field>
            </div>
          </Card>

          <Card className="p-8">
            <div className="label-eyebrow mb-7">{t("new.config.title")}</div>

            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <RowField label={t("new.direction")}>
                <Select value={direction} onValueChange={(v) => setDirection(v as JobDirection)}>
                  <SelectTrigger className="h-11 rounded-xl border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_DIRECTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{t(d.labelKey)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </RowField>

              <RowField label={t("new.duration")}>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <SegButton key={d} active={duration === d} onClick={() => setDuration(d)}>
                      {t("new.duration.min", { min: d })}
                    </SegButton>
                  ))}
                </div>
              </RowField>

              <RowField label={t("new.difficulty")}>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <SegButton key={d.value} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
                      {t(d.labelKey)}
                    </SegButton>
                  ))}
                </div>
              </RowField>
            </div>

            <div className="mt-8">
              <div className="label-eyebrow mb-3">{t("new.type")}</div>
              <div className="flex flex-wrap gap-1 rounded-full border border-border p-1.5">
                {INTERVIEW_TYPES.map((it) => (
                  <button key={it.value} type="button" onClick={() => setInterviewType(it.value)}
                    className={cn(
                      "flex-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium uppercase tracking-wider transition-smooth",
                      interviewType === it.value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}>
                    {t(it.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview mode: text vs video */}
            <div className="mt-8">
              <div className="label-eyebrow mb-3">{t("new.mode")}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {INTERVIEW_MODES.map((m) => {
                  const Icon = m.value === "video" ? Video : MessageSquareText;
                  const active = mode === m.value;
                  return (
                    <button key={m.value} type="button" onClick={() => setMode(m.value)}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-smooth",
                        active ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground/40",
                      )}>
                      <span className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground",
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{t(m.labelKey)}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{t(m.descKey)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" disabled={submitting}
            className="h-12 w-full rounded-full text-sm">
            {submitting ? t("new.submitting") : t("new.submit")}
            {!submitting && <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
        </form>

        {/* Right: preparation summary + sample output */}
        <aside className="min-w-0 space-y-6 xl:sticky xl:top-28 xl:self-start">
          <Card className="p-7">
            <div className="mb-5 flex items-center gap-2 label-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              {t("new.preview.title")}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("new.preview.desc")}</p>
            <ul className="mt-6 space-y-5">
              {previewItems.map((item, i) => (
                <li key={item.key} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t(`new.preview.${item.key}.title`)}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`new.preview.${item.key}.desc`)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-7">
            <div className="mb-5 flex items-center gap-2 label-eyebrow">
              <CircleCheck className="h-4 w-4" />
              {t("new.sample.title")}
            </div>
            <div className="rounded-xl border border-border bg-secondary/40 p-5">
              <div className="flex items-end justify-between">
                <span className="label-eyebrow">{t("report.matchScore")}</span>
                <span className="display text-3xl">78</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs">{t("report.match.strong")}</span>
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs">{t("report.match.weak")}</span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t("new.sample.note")}</p>
            </div>
            <div className="mt-5 flex items-center gap-2 label-eyebrow">
              <ArrowRight className="h-3.5 w-3.5" />
              {t("new.sample.flow")}
            </div>
          </Card>
        </aside>
      </div>
    </AppLayout>
  );
};

const Field = ({ label, icon: Icon, children }: { label: string; icon?: typeof FileText; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <label className="flex items-center gap-2 text-sm font-medium">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {label}
    </label>
    {children}
  </div>
);

const RowField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2.5 py-5 first:pt-0">
    <div className="text-sm font-medium">{label}</div>
    {children}
  </div>
);

const SegButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={cn(
      "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-smooth",
      active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40",
    )}>
    {children}
  </button>
);

export default NewTask;
