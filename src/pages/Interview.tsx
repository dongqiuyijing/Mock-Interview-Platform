import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Send, Flag, Target, Layers, ArrowRight, Eye, HelpCircle, Loader2,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  streamNextQuestion, finishInterview,
} from "@/lib/api";
import {
  InterviewTask, InterviewMessage, dirKey, typeKey,
} from "@/lib/interview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMsg {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  stage?: string | null;
  competency?: string | null;
}

const Interview = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const [task, setTask] = useState<InterviewTask | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState("");
  const [thinking, setThinking] = useState(false);
  const [input, setInput] = useState("");
  const [answered, setAnswered] = useState(0);
  const [done, setDone] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);

  // Load task + start first question.
  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const { data: session } = await supabase
        .from("interview_sessions")
        .select("task_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (!session) {
        navigate("/");
        return;
      }
      const { data: tk } = await supabase
        .from("interview_tasks")
        .select("*")
        .eq("id", session.task_id)
        .maybeSingle();
      if (!tk) {
        navigate("/");
        return;
      }
      setTask(tk as InterviewTask);
      await askNext(null);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming, thinking]);

  const askNext = async (answer: string | null) => {
    if (!sessionId) return;
    setThinking(true);
    setStreaming("");
    try {
      const result = await streamNextQuestion(
        sessionId,
        answer,
        i18n.language,
        (delta) => {
          setThinking(false);
          setStreaming((prev) => prev + delta);
        },
      );

      if (result.done && !result.message) {
        // capped / reached limit, no new question
        setDone(true);
        setStreaming("");
        setFinishOpen(true);
        return;
      }

      const msg = result.message as InterviewMessage;
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          role: "interviewer",
          content: msg.content,
          stage: result.stage,
          competency: msg.jd_competency,
        },
      ]);
      setCurrentStage(result.stage ?? null);
      setStreaming("");
      if (result.done) setDone(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setThinking(false);
    }
  };

  const send = async () => {
    if (!input.trim() || thinking || streaming) return;
    const answer = input.trim();
    setMessages((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, role: "candidate", content: answer },
    ]);
    setAnswered((a) => a + 1);
    setInput("");
    await askNext(answer);
  };

  const finish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    try {
      await finishInterview(sessionId, i18n.language, () => {});
      navigate(`/feedback?sessionId=${sessionId}`);
    } catch (err) {
      toast.error((err as Error).message);
      setFinishing(false);
    }
  };

  if (!task) {
    return (
      <AppLayout step="interview" activePath="/new">
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("interview.loading")}
        </div>
      </AppLayout>
    );
  }

  const lastQuestion = [...messages].reverse().find((m) => m.role === "interviewer");
  const canSend = !thinking && !streaming && !done;

  return (
    <AppLayout step="interview" activePath="/new">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="label-eyebrow mb-2">{t("step.indexLabel", { index: 3, total: 4 })}</div>
          <h1 className="display text-3xl">{t("interview.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{task.job_title}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFinishOpen(true)} className="rounded-full">
          <Flag className="mr-2 h-4 w-4" />{t("interview.finish")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Chat */}
        <Card className="flex h-[calc(100vh-260px)] min-h-[460px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <span className="label-eyebrow">{t("interview.live")}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">{t("interview.answered", { count: answered })}</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-6">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex flex-col", m.role === "candidate" ? "items-end" : "items-start")}>
                {m.role === "interviewer" && m.competency && (
                  <div className="mb-1.5 label-eyebrow">{m.competency}</div>
                )}
                <div className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "interviewer" ? "border border-border bg-card" : "bg-foreground text-background",
                )}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* live streaming question */}
            {streaming && (
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-relaxed">
                  {streaming}
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-soft bg-foreground align-middle" />
                </div>
              </div>
            )}

            {thinking && !streaming && (
              <div className="flex w-fit items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3.5">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground" />
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            {done ? (
              <Button className="w-full rounded-full" size="lg" onClick={() => setFinishOpen(true)}>
                {t("interview.allDone")}<ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
                  }}
                  placeholder={t("interview.placeholder")}
                  className="min-h-[52px] resize-none rounded-xl border-border"
                />
                <Button onClick={send} disabled={!input.trim() || !canSend} size="icon"
                  className="h-[52px] w-[52px] shrink-0 rounded-xl">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Live interviewer panel */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2 label-eyebrow">
              <Eye className="h-4 w-4" />{t("interview.panel.title")}
            </div>
            <div className="space-y-4">
              <PanelRow icon={Layers} label={t("interview.stage")} value={currentStage ?? "—"} />
              <PanelRow icon={Target} label={t("interview.competency")} value={lastQuestion?.competency ?? "—"} />
              <PanelRow icon={HelpCircle} label={t("interview.panel.intent")}
                value={done ? t("interview.panel.wrapup") : t("interview.panel.active")} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 label-eyebrow">
              <Target className="h-4 w-4" />{t("interview.taskInfo")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-border px-2.5 py-1 text-xs">{t(dirKey(task.job_direction))}</span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs">{t(typeKey(task.interview_type))}</span>
            </div>
          </Card>
        </aside>
      </div>

      <Dialog open={finishOpen} onOpenChange={(o) => !finishing && setFinishOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("interview.finishTitle")}</DialogTitle>
            <DialogDescription>{t("interview.finishDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)} disabled={finishing}>
              {t("interview.continue")}
            </Button>
            <Button onClick={finish} disabled={finishing}>
              {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("interview.generateFeedback")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

const PanelRow = ({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    <div>
      <div className="label-eyebrow">{label}</div>
      <div className="mt-1 text-sm font-medium leading-snug">{value}</div>
    </div>
  </div>
);

export default Interview;
