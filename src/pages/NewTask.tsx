import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, FileUser, ArrowRight, Sparkles, Target, ListChecks, CircleCheck, MessageSquareText, Video, Wand2, Loader2, FolderOpen } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { ImageOcrButton } from "@/components/ImageOcrButton";
import { ResumePickerDialog } from "@/components/ResumePickerDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { INTERVIEW_TYPES, DIFFICULTIES, DURATIONS, INTERVIEW_MODES, InterviewType, Difficulty, InterviewMode } from "@/lib/interview";
import { createTask, analyzeTask, suggestConfig } from "@/lib/api";
import { cn } from "@/lib/utils";
import { trackEvent } from "@enter-pro/analytics-sdk";
const SAMPLE_JD = `We are hiring an AI Product Manager to own our LLM-powered assistant. You will define the roadmap, design evaluation metrics for answer quality, partner with engineering on RAG and agent workflows, and balance latency, cost and reliability. Experience shipping AI features to production required.`;
const SAMPLE_RESUME = `Product Manager with 4 years experience. Shipped a customer-support assistant using retrieval-augmented generation, improving deflection by 28%. Built an eval harness with human + automated scoring. Partnered with ML engineers on prompt iteration and cost optimization.`;
const NewTask = () => {
  const {
    t,
    i18n
  } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [jobTitle, setJobTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [direction, setDirection] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("product");
  const [mode, setMode] = useState<InterviewMode>(searchParams.get("mode") === "video" ? "video" : "text");
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [resumePickerOpen, setResumePickerOpen] = useState(false);
  // Remember the JD we last auto-generated config from, so we only re-run when
  // the job description actually changes.
  const lastAutoJd = useRef<string>("");
  const fillSample = () => {
    setJobTitle("Senior AI Product Manager");
    setJdText(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
    setDirection("AI Product Manager");
  };

  // Automatically infer the interview config from the JD (no manual confirm).
  // Triggered when the JD textarea loses focus, after OCR, or before submit.
  const autoGenerateConfig = async (jdOverride?: string) => {
    const jd = (jdOverride ?? jdText).trim();
    if (jd.length < 30 || jd === lastAutoJd.current || autoFilling) return;
    lastAutoJd.current = jd;
    setAutoFilling(true);
    try {
      const cfg = await suggestConfig(jd, resumeText, i18n.language);
      // Only fill fields the user hasn't manually set, so we never overwrite
      // their edits silently.
      setJobTitle(v => v || cfg.job_title || v);
      setDirection(v => v || cfg.job_direction || v);
      if (cfg.interview_type) setInterviewType(cfg.interview_type);
      if (cfg.difficulty) setDifficulty(cfg.difficulty);
      if (cfg.duration) setDuration(cfg.duration);
    } catch {
      // Silent: auto-generation is best-effort; the user can still submit.
      lastAutoJd.current = "";
    } finally {
      setAutoFilling(false);
    }
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
        jobTitle: jobTitle || direction || t("new.direction"),
        jobDirection: direction || jobTitle || t("new.direction"),
        interviewType,
        difficulty,
        duration,
        jdText,
        resumeText,
        mode
      });
      await analyzeTask(taskId, i18n.language);
      trackEvent("task_created", {
        eventType: "conversion",
        properties: { interview_type: interviewType, difficulty, duration, mode },
      });
      navigate(`/analysis?taskId=${taskId}`);
    } catch (err) {
      toast.error((err as Error).message ?? t("new.error.short"));
      setSubmitting(false);
    }
  };
  const previewItems = [{
    icon: Target,
    key: "role"
  }, {
    icon: FileUser,
    key: "resume"
  }, {
    icon: ListChecks,
    key: "plan"
  }, {
    icon: Sparkles,
    key: "feedback"
  }];
  return <AppLayout step="create" activePath="/new">
      <ResumePickerDialog open={resumePickerOpen} onOpenChange={setResumePickerOpen} onSelect={r => {
      setResumeText(r.content);
      setResumeName(r.name);
    }} />
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-foreground/80 text-sm font-semibold">
            01
          </span>
          <div>
            <div className="label-eyebrow mb-2">{t("step.indexLabel", {
              index: 1,
              total: 4
            })}</div>
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
      <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.42fr)] xl:gap-12">
        {/* Left: form */}
        <form onSubmit={handleSubmit} className="min-w-0 space-y-8">
          <Card className="p-8">
            
            <div className="space-y-7">
              <Field label={t("new.jobTitle")}>
                
              </Field>

              <Field label={t("new.jd")} icon={FileText} action={<ImageOcrButton onText={txt => {
              setJdText(p => {
                const next = p ? `${p}\n${txt}` : txt;
                setTimeout(() => autoGenerateConfig(next), 0);
                return next;
              });
            }} />}>
                <Textarea value={jdText} onChange={e => setJdText(e.target.value)} onBlur={autoGenerateConfig} placeholder={t("new.jd.ph")} className="min-h-[150px] resize-y rounded-xl border-border" />
              </Field>

              <Field label={t("new.resume")} icon={FileUser} action={<Button type="button" variant="outline" size="sm" onClick={() => setResumePickerOpen(true)} className="h-8 rounded-full px-3 text-xs">
                    <FolderOpen className="mr-1.5 h-3.5 w-3.5" />{t("new.resume.configure")}
                  </Button>}>
                {resumeName ? <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{resumeName}</span>
                    <CircleCheck className="h-4 w-4 shrink-0 text-success" />
                  </div> : <button type="button" onClick={() => setResumePickerOpen(true)} className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm text-muted-foreground transition-smooth hover:border-foreground/40 hover:text-foreground">
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    {t("new.resume.none")}
                  </button>}
              </Field>
            </div>

            
          </Card>

          <Card className="p-8">
            

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              <RowField label={t("new.duration")}>
                <div className="flex gap-2">
                  {DURATIONS.map(d => <SegButton key={d} active={duration === d} onClick={() => setDuration(d)}>
                      {t("new.duration.min", {
                    min: d
                  })}
                    </SegButton>)}
                </div>
              </RowField>

              <RowField label={t("new.difficulty")}>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => <SegButton key={d.value} active={difficulty === d.value} onClick={() => setDifficulty(d.value)}>
                      {t(d.labelKey)}
                    </SegButton>)}
                </div>
              </RowField>
            </div>

            <div className="mt-8">
              <div className="label-eyebrow mb-3">{t("new.type")}</div>
              <div className="flex flex-wrap gap-1 rounded-full border border-border p-1.5">
                {INTERVIEW_TYPES.map(it => <button key={it.value} type="button" onClick={() => setInterviewType(it.value)} className={cn("flex-1 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium uppercase tracking-wider transition-smooth", interviewType === it.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
                    {t(it.labelKey)}
                  </button>)}
              </div>
            </div>

            {/* Interview mode: text vs video */}
            <div className="mt-8">
              <div className="label-eyebrow mb-3">{t("new.mode")}</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {INTERVIEW_MODES.map(m => {
                const Icon = m.value === "video" ? Video : MessageSquareText;
                const active = mode === m.value;
                return <button key={m.value} type="button" onClick={() => setMode(m.value)} className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left transition-smooth", active ? "border-foreground bg-secondary/60" : "border-border hover:border-foreground/40")}>
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground")}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{t(m.labelKey)}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{t(m.descKey)}</span>
                      </span>
                    </button>;
              })}
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" disabled={submitting} className="h-12 w-full rounded-full text-sm">
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
              {previewItems.map((item, i) => <li key={item.key} className="flex gap-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t(`new.preview.${item.key}.title`)}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{t(`new.preview.${item.key}.desc`)}</div>
                  </div>
                </li>)}
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
    </AppLayout>;
};
const Field = ({
  label,
  icon: Icon,
  action,
  children
}: {
  label: string;
  icon?: typeof FileText;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-2">
      
      {action}
    </div>
    {children}
  </div>;
const RowField = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => <div className="space-y-2.5">
    <div className="text-sm font-medium">{label}</div>
    {children}
  </div>;
const SegButton = ({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => <button type="button" onClick={onClick} className={cn("flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-smooth", active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-foreground/40")}>
    {children}
  </button>;
export default NewTask;