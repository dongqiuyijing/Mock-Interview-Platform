import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, Flag, Target, Layers, Gauge } from "lucide-react";
import { WorkbenchLayout } from "@/components/WorkbenchLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { store, MockTask, MockMessage } from "@/lib/workspaceStore";
import { interviewQuestions, generateFeedback } from "@/lib/mockGenerators";
import { dirKey, typeKey } from "@/lib/interview";

const Interview = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [task, setTask] = useState<MockTask | null>(null);
  const [questions, setQuestions] = useState<MockMessage[]>([]);
  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [qIndex, setQIndex] = useState(0); // index of next question to ask
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
    // start with first question
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
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Chat */}
        <div className="flex h-[calc(100vh-260px)] min-h-[460px] flex-col">
          <Card className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t("interview.title")}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setFinishOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />{t("interview.finish")}
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-5">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "candidate" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.role === "interviewer" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                    {m.role === "interviewer" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "interviewer" ? "bg-muted" : "bg-primary text-primary-foreground"
                  }`}>
                    {m.role === "interviewer" && m.competency && (
                      <div className="mb-1 text-[11px] font-medium uppercase tracking-wide opacity-70">{m.competency}</div>
                    )}
                    {m.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
                    <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground" />
                    <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              {isLast && answered >= total ? (
                <Button className="w-full" size="lg" onClick={() => setFinishOpen(true)}>
                  <Flag className="mr-2 h-4 w-4" />{t("interview.allDone")}
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
                    className="min-h-[52px] resize-none"
                  />
                  <Button onClick={send} disabled={!input.trim() || thinking} size="icon" className="h-[52px] w-[52px] shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("interview.progress")}</h3>
            </div>
            <Progress value={(answered / total) * 100} className="h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {t("interview.progressLabel", { answered, total })}
            </p>
          </Card>

          <Card className="space-y-3 p-5">
            <SideRow icon={Layers} label={t("interview.stage")} value={lastQuestion?.stage ?? "—"} />
            <SideRow icon={Target} label={t("interview.competency")} value={lastQuestion?.competency ?? "—"} />
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 text-sm font-semibold">{t("interview.taskInfo")}</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">{task.jobTitle}</div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="secondary" className="font-normal">{t(dirKey(task.jobDirection))}</Badge>
                <Badge variant="secondary" className="font-normal">{t(typeKey(task.interviewType))}</Badge>
              </div>
            </div>
          </Card>
        </aside>
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
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  </div>
);

export default Interview;
