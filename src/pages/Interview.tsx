import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Send, Flag, Target, Layers, ArrowRight } from "lucide-react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { StepHeader } from "@/components/StepHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { store, MockTask, MockMessage } from "@/lib/workspaceStore";
import { interviewQuestions, generateFeedback } from "@/lib/mockGenerators";
import { dirKey, typeKey } from "@/lib/interview";
import { cn } from "@/lib/utils";

const Interview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [task, setTask] = useState<MockTask | null>(null);
  const [questions, setQuestions] = useState<MockMessage[]>([]);
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [finishOpen, setFinishOpen] = useState(false);

  useEffect(() => {
    const tk = store.getTask();
    if (!tk) {
      navigate("/");
      return;
    }
    setTask(tk);
    const qs = interviewQuestions(tk, t);
    setQuestions(qs);
    const first = [qs[0]];
    setMessages(first);
    setQIndex(1);
    store.setMessages(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  if (!task) return null;

  const answered = messages.filter((m) => m.role === "candidate").length;
  const total = questions.length;
  const lastQuestion = messages.filter((m) => m.role === "interviewer").slice(-1)[0];
  const isLast = qIndex >= total;

  const send = () => {
    if (!input.trim() || thinking) return;
    const answer: MockMessage = { id: `c-${Date.now()}`, role: "candidate", content: input.trim() };
    const withAnswer = [...messages, answer];
    setMessages(withAnswer);
    store.setMessages(withAnswer);
    setInput("");

    if (qIndex < total) {
      setThinking(true);
      setTimeout(() => {
        const next = questions[qIndex];
        const updated = [...withAnswer, next];
        setMessages(updated);
        store.setMessages(updated);
        setQIndex((i) => i + 1);
        setThinking(false);
      }, 800);
    }
  };

  const finish = () => {
    const fb = generateFeedback(task, store.getMessages(), t);
    store.setFeedback(fb);
    navigate("/feedback");
  };

  return (
    <WorkbenchLayout step="interview">
      <div className="grid gap-12 lg:grid-cols-[minmax(280px,360px)_1fr] lg:gap-20">
        {/* Left: header + live status */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <StepHeader index={3} title={t("interview.title")} description={t("interview.lead")} />

          <div className="mt-10 space-y-6 border-t border-border pt-8">
            <div>
              <div className="label-eyebrow mb-3">{t("interview.progress")}</div>
              <div className="flex items-end gap-2">
                <span className="display text-4xl">{answered}</span>
                <span className="mb-1 text-sm text-muted-foreground">/ {total}</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-foreground transition-smooth"
                  style={{ width: `${(answered / total) * 100}%` }} />
              </div>
            </div>

            <SideRow icon={Layers} label={t("interview.stage")} value={lastQuestion?.stage ?? "—"} />
            <SideRow icon={Target} label={t("interview.competency")} value={lastQuestion?.competency ?? "—"} />

            <div className="border-t border-border pt-5">
              <div className="label-eyebrow mb-2">{t("interview.taskInfo")}</div>
              <div className="text-sm font-medium">{task.jobTitle}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-border px-2.5 py-1 text-xs">{t(dirKey(task.jobDirection))}</span>
                <span className="rounded-full border border-border px-2.5 py-1 text-xs">{t(typeKey(task.interviewType))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: chat */}
        <div className="flex h-[calc(100vh-220px)] min-h-[480px] flex-col">
          <Card className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="label-eyebrow">{t("interview.live")}</span>
              <Button variant="outline" size="sm" onClick={() => setFinishOpen(true)} className="rounded-full">
                <Flag className="mr-2 h-4 w-4" />{t("interview.finish")}
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-6">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex flex-col", m.role === "candidate" ? "items-end" : "items-start")}>
                  {m.role === "interviewer" && m.competency && (
                    <div className="mb-1.5 label-eyebrow">{m.competency}</div>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "interviewer"
                      ? "border border-border bg-card"
                      : "bg-foreground text-background",
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3.5 w-fit">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              {isLast && answered >= total ? (
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
                  <Button onClick={send} disabled={!input.trim() || thinking} size="icon"
                    className="h-[52px] w-[52px] shrink-0 rounded-xl">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("interview.finishTitle")}</DialogTitle>
            <DialogDescription>{t("interview.finishDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)}>{t("interview.continue")}</Button>
            <Button onClick={finish}>{t("interview.generateFeedback")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkbenchLayout>
  );
};

const SideRow = ({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) => (
  <div className="flex items-start gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    <div>
      <div className="label-eyebrow">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  </div>
);

export default Interview;
