import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Send, Loader2, Bot, User as UserIcon, Flag, Brain,
  Layers, Activity, Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { InterviewMessage, InterviewSession, InterviewTask, dirKey, typeKey, difficultyKey } from "@/lib/interview";

const Interview = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lang = localStorage.getItem("i18nextLng") ?? "zh-CN";

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [task, setTask] = useState<InterviewTask | null>(null);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const maxQuestions = 5;

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  const askNext = useCallback(async (sessionId: string, userAnswer?: string) => {
    setThinking(true);
    const { data, error } = await supabase.functions.invoke("interview-agent", {
      body: { action: "interview_next", sessionId, answer: userAnswer ?? "", lang },
    });
    setThinking(false);
    if (error) {
      toast.error(t("interview.error"));
      return;
    }
    if (data?.done) {
      setDone(true);
      return;
    }
    if (data?.message) {
      setMessages((prev) => [...prev, data.message as InterviewMessage]);
      setSession((prev) => prev ? { ...prev, current_stage: data.stage ?? prev.current_stage } : prev);
      scrollToBottom();
    }
  }, [lang, t]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: sess } = await supabase
        .from("interview_sessions").select("*").eq("id", id).maybeSingle();
      if (!sess) { setLoading(false); return; }
      setSession(sess as InterviewSession);

      const { data: taskData } = await supabase
        .from("interview_tasks").select("*").eq("id", sess.task_id).maybeSingle();
      setTask(taskData as InterviewTask);

      const { data: msgs } = await supabase
        .from("interview_messages").select("*").eq("session_id", id)
        .order("created_at", { ascending: true });
      const list = (msgs as InterviewMessage[]) ?? [];
      setMessages(list);
      setLoading(false);

      if (sess.status === "completed" || sess.status === "awaiting_feedback") {
        setDone(true);
      } else if (list.length === 0) {
        askNext(id);
      } else {
        scrollToBottom();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSend = async () => {
    if (!answer.trim() || !id || thinking) return;
    const text = answer.trim();
    setAnswer("");
    const optimistic: InterviewMessage = {
      id: `temp-${Date.now()}`, session_id: id, role: "candidate",
      content: text, question_type: null, jd_competency: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToBottom();
    await askNext(id, text);
  };

  const handleFinish = async () => {
    if (!id) return;
    setFinishing(true);
    const { error } = await supabase.functions.invoke("interview-agent", {
      body: { action: "finish", sessionId: id, lang },
    });
    setFinishing(false);
    if (error) {
      toast.error(t("interview.finishError"));
      return;
    }
    navigate(`/sessions/${id}/feedback`);
  };

  const askedCount = messages.filter((m) => m.role === "interviewer").length;
  const progress = Math.min((askedCount / maxQuestions) * 100, 100);
  const lastQuestion = [...messages].reverse().find((m) => m.role === "interviewer");

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <AppHeader />
      <div className="container flex flex-1 gap-6 overflow-hidden py-6">
        {/* Main chat */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-2">
            {messages.map((m) => (
              <div key={m.id}
                className={`flex gap-3 animate-fade-in ${m.role === "candidate" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  m.role === "interviewer" ? "gradient-primary" : "bg-secondary"}`}>
                  {m.role === "interviewer"
                    ? <Bot className="h-5 w-5 text-primary-foreground" />
                    : <UserIcon className="h-5 w-5 text-secondary-foreground" />}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "interviewer"
                    ? "bg-card shadow-sm border border-border"
                    : "gradient-primary text-primary-foreground"}`}>
                  {m.role === "interviewer" && m.jd_competency && (
                    <Badge variant="secondary" className="mb-2 text-xs font-normal">
                      {m.jd_competency}
                    </Badge>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3">
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary" />
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary [animation-delay:0.2s]" />
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-primary [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Composer / finish */}
          <div className="mt-4 shrink-0">
            {done ? (
              <Card className="flex flex-col items-center gap-3 p-6 text-center">
                <Flag className="h-7 w-7 text-primary" />
                <p className="font-medium">{t("interview.done.title")}</p>
                <p className="text-sm text-muted-foreground">{t("interview.done.desc")}</p>
                <Button onClick={handleFinish} disabled={finishing} className="shadow-glow">
                  {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Brain className="mr-2 h-4 w-4" />}
                  {t("interview.viewFeedback")}
                </Button>
              </Card>
            ) : (
              <div className="flex items-end gap-2">
                <Textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder={t("interview.placeholder")}
                  className="min-h-[60px] max-h-40 resize-none"
                  disabled={thinking}
                />
                <div className="flex flex-col gap-2">
                  <Button size="icon" onClick={handleSend} disabled={thinking || !answer.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline" title={t("interview.finish")}>
                        <Flag className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("interview.finishConfirm.title")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("interview.finishConfirm.desc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleFinish}>{t("interview.finish")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
            <p className="mt-1.5 text-center text-xs text-muted-foreground">{t("interview.hint")}</p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto lg:flex">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("interview.progress")}</h3>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("interview.questionCount", { count: askedCount, total: maxQuestions })}
            </p>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">{t("interview.stage")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {session?.current_stage ?? t("interview.stage.warmup")}
            </p>
          </Card>

          {lastQuestion?.jd_competency && (
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-semibold">{t("interview.competency")}</h3>
              </div>
              <Badge variant="secondary">{lastQuestion.jd_competency}</Badge>
            </Card>
          )}

          {task && (
            <Card className="p-5">
              <h3 className="mb-2 text-sm font-semibold">{task.job_title}</h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="font-normal">{t(dirKey(task.job_direction))}</Badge>
                <Badge variant="outline" className="font-normal">{t(typeKey(task.interview_type))}</Badge>
                <Badge variant={task.difficulty === "stress" ? "destructive" : "outline"} className="font-normal">
                  {t(difficultyKey(task.difficulty))}
                </Badge>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Interview;
