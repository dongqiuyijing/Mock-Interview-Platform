import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Terminal, FileText, FileUser, ArrowRight } from "lucide-react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { StepHeader } from "@/components/StepHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  JOB_DIRECTIONS, INTERVIEW_TYPES, DIFFICULTIES, DURATIONS,
  JobDirection, InterviewType, Difficulty, dirKey,
} from "@/lib/interview";
import { store, MockTask } from "@/lib/workspaceStore";
import { generateAnalysis } from "@/lib/mockGenerators";
import { cn } from "@/lib/utils";

const SAMPLE_JD = `We are hiring an AI Product Manager to own our LLM-powered assistant. You will define the roadmap, design evaluation metrics for answer quality, partner with engineering on RAG and agent workflows, and balance latency, cost and reliability. Experience shipping AI features to production required.`;
const SAMPLE_RESUME = `Product Manager with 4 years experience. Shipped a customer-support assistant using retrieval-augmented generation, improving deflection by 28%. Built an eval harness with human + automated scoring. Partnered with ML engineers on prompt iteration and cost optimization.`;

const NewTask = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [direction, setDirection] = useState<JobDirection>("ai_pm");
  const [interviewType, setInterviewType] = useState<InterviewType>("product");
  const [duration, setDuration] = useState(30);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [submitting, setSubmitting] = useState(false);

  const fillSample = () => {
    setJobTitle("Senior AI Product Manager");
    setJdText(SAMPLE_JD);
    setResumeText(SAMPLE_RESUME);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jdText.trim().length < 30 || resumeText.trim().length < 30) {
      toast.error(t("new.error.short"));
      return;
    }
    setSubmitting(true);
    const task: MockTask = {
      jobTitle: jobTitle || t(dirKey(direction)),
      jobDirection: direction,
      interviewType,
      duration,
      difficulty,
      jdText,
      resumeText,
      createdAt: new Date().toISOString(),
    };
    store.clearAll();
    store.setTask(task);
    store.setAnalysis(generateAnalysis(task, t));
    setTimeout(() => navigate("/analysis"), 650);
  };

  const requirements = [
    { k: "direction", label: t("new.direction") },
    { k: "type", label: t("new.type") },
    { k: "duration", label: t("new.duration") },
  ];

  return (
    <WorkbenchLayout step="create">
      <div className="grid gap-12 lg:grid-cols-[minmax(280px,380px)_1fr] lg:gap-20">
        {/* Left: editorial header */}
        <StepHeader index={1} title={t("new.title")} description={t("new.subtitle")} />

        {/* Right: content */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <p className="text-[15px] leading-relaxed">{t("new.lead")}</p>

          {/* Inputs card */}
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

            <button type="button" onClick={fillSample}
              className="mt-6 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              {t("new.useSample")}
            </button>
          </Card>

          {/* Configuration "requirements" table */}
          <Card className="overflow-hidden p-8">
            <div className="label-eyebrow mb-7">{t("new.config.title")}</div>

            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {/* Role direction */}
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

              {/* Duration */}
              <RowField label={t("new.duration")}>
                <div className="flex gap-2">
                  {DURATIONS.map((d) => (
                    <SegButton key={d} active={duration === d} onClick={() => setDuration(d)}>
                      {t("new.duration.min", { min: d })}
                    </SegButton>
                  ))}
                </div>
              </RowField>

              {/* Difficulty */}
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

            {/* Interview type pill tabs */}
            <div className="mt-8">
              <div className="label-eyebrow mb-3">{t("new.type")}</div>
              <div className="flex flex-wrap gap-2 rounded-full border border-border p-1.5">
                {INTERVIEW_TYPES.map((it) => (
                  <button key={it.value} type="button" onClick={() => setInterviewType(it.value)}
                    className={cn(
                      "flex-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-smooth",
                      interviewType === it.value
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}>
                    {t(it.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* What you'll get — two info cards */}
          <div>
            <div className="mb-4 flex items-center gap-2 label-eyebrow">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              {t("new.preview.title")}
            </div>
            <Card className="grid gap-px overflow-hidden bg-border sm:grid-cols-2">
              <InfoCell icon={Terminal} title={t("new.preview.role.title")} desc={t("new.preview.role.desc")} />
              <InfoCell icon={ArrowRight} title={t("new.preview.feedback.title")} desc={t("new.preview.feedback.desc")} />
            </Card>
          </div>

          <Button type="submit" size="lg" disabled={submitting}
            className="h-12 w-full rounded-full text-sm">
            {submitting ? t("new.submitting") : t("new.submit")}
            {!submitting && <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
        </form>
      </div>
    </WorkbenchLayout>
  );
};

const Field = ({ label, icon: Icon, children }: { label: string; icon?: typeof FileText; children: ReactChild }) => (
  <div className="space-y-2.5">
    <label className="flex items-center gap-2 text-sm font-medium">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      {label}
    </label>
    {children}
  </div>
);

const RowField = ({ label, children }: { label: string; children: ReactChild }) => (
  <div className="space-y-2.5 border-b border-border py-5 first:pt-0 sm:border-b-0 sm:py-5">
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

const InfoCell = ({ icon: Icon, title, desc }: { icon: typeof Terminal; title: string; desc: string }) => (
  <div className="bg-card p-7">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border">
      <Icon className="h-4 w-4" />
    </div>
    <div className="font-semibold">{title}</div>
    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
  </div>
);

type ReactChild = React.ReactNode;

export default NewTask;
