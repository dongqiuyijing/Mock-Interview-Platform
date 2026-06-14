import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Sparkles, FileText, FileUser, Lightbulb, Target, ListChecks,
  ArrowRight, CircleCheck,
} from "lucide-react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  JOB_DIRECTIONS, INTERVIEW_TYPES, DIFFICULTIES, DURATIONS,
  JobDirection, InterviewType, Difficulty, dirKey,
} from "@/lib/interview";
import { store, MockTask } from "@/lib/workspaceStore";
import { generateAnalysis } from "@/lib/mockGenerators";

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
    // brief delay for a polished "generating" feel
    setTimeout(() => navigate("/analysis"), 650);
  };

  const previewItems = [
    { icon: Target, key: "role" },
    { icon: FileUser, key: "resume" },
    { icon: ListChecks, key: "plan" },
    { icon: Sparkles, key: "feedback" },
  ];

  return (
    <WorkbenchLayout step="create">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("new.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("new.subtitle")}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={fillSample}>
          <Lightbulb className="mr-2 h-4 w-4" />
          {t("new.useSample")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="title">{t("new.jobTitle")}</Label>
              <Input id="title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t("new.jobTitle.ph")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />{t("new.jd")}
              </Label>
              <Textarea id="jd" value={jdText} onChange={(e) => setJdText(e.target.value)}
                placeholder={t("new.jd.ph")} className="min-h-[150px] resize-y" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume" className="flex items-center gap-2">
                <FileUser className="h-4 w-4 text-muted-foreground" />{t("new.resume")}
              </Label>
              <Textarea id="resume" value={resumeText} onChange={(e) => setResumeText(e.target.value)}
                placeholder={t("new.resume.ph")} className="min-h-[150px] resize-y" />
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
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" onClick={() => setDuration(d)}
                    className={`flex-1 rounded-md border p-2.5 text-sm font-medium transition-smooth ${
                      duration === d ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    {t("new.duration.min", { min: d })}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("new.difficulty")}</Label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button key={d.value} type="button" onClick={() => setDifficulty(d.value)}
                    className={`flex-1 rounded-md border p-2.5 text-sm font-medium transition-smooth ${
                      difficulty === d.value ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                    {t(d.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <><Sparkles className="mr-2 h-4 w-4 animate-pulse-soft" />{t("new.submitting")}</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" />{t("new.submit")}</>
            )}
          </Button>
        </form>

        {/* Right: preparation summary / sample output */}
        <aside className="space-y-4 lg:sticky lg:top-[150px] lg:self-start">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">{t("new.preview.title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("new.preview.desc")}</p>
            <ul className="mt-4 space-y-3">
              {previewItems.map((item) => (
                <li key={item.key} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <item.icon className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t(`new.preview.${item.key}.title`)}</div>
                    <div className="text-xs text-muted-foreground">{t(`new.preview.${item.key}.desc`)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <CircleCheck className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold">{t("new.sample.title")}</h3>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t("report.matchScore")}</span>
                <span className="text-lg font-bold text-primary">78</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="font-normal">{t("report.match.strong")}</Badge>
                <Badge variant="outline" className="font-normal">{t("report.match.weak")}</Badge>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {t("new.sample.note")}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              {t("new.sample.flow")}
            </div>
          </Card>
        </aside>
      </div>
    </WorkbenchLayout>
  );
};

export default NewTask;
