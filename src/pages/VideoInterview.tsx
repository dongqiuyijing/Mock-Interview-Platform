import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Mic, MicOff, Video, VideoOff, Captions, CaptionsOff,
  Pause, Play, PhoneOff, Loader2, Target, Layers, Circle,
  Square, RotateCcw, Send, Sparkles, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { InterviewerAvatar, SpeakState } from "@/components/InterviewerAvatar";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { supabase } from "@/integrations/supabase/client";
import { streamNextQuestion, finishInterview } from "@/lib/api";
import { InterviewTask, dirKey, typeKey } from "@/lib/interview";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Phase =
  | "connecting"
  | "asking"      // interviewer streaming a question
  | "waiting"     // waiting for user to start answering
  | "recording"   // user answering
  | "thinking"    // AI processing follow-up
  | "done";

type CamState = "idle" | "granted" | "denied" | "simulated";

interface Caption {
  id: string;
  speaker: "interviewer" | "candidate";
  text: string;
}

const VideoInterview = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const startedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [task, setTask] = useState<InterviewTask | null>(null);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [liveQuestion, setLiveQuestion] = useState("");
  const [currentStage, setCurrentStage] = useState<string | null>(null);
  const [competency, setCompetency] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  // Which feed occupies the big stage: the candidate's camera or the AI.
  const [mainStage, setMainStage] = useState<"self" | "interviewer">("self");

  // Controls
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const [camState, setCamState] = useState<CamState>("idle");

  // Answer drafting
  const [draft, setDraft] = useState("");
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // ---- speech-to-text ----
  const speechLang = i18n.language.startsWith("zh") ? "zh-CN" : "en-US";
  const { supported: speechSupported, listening, interim, start: startSpeech, stop: stopSpeech } =
    useSpeechRecognition({
      lang: speechLang,
      onFinal: (text) => setDraft((d) => (d ? `${d} ${text}` : text).trimStart()),
    });

  const avatarState: SpeakState =
    phase === "asking" ? "speaking"
      : phase === "thinking" ? "thinking"
        : phase === "recording" || phase === "waiting" ? "listening"
          : "idle";

  // ---- timer ----
  useEffect(() => {
    if (paused || phase === "connecting" || phase === "done") return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [paused, phase]);

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Keep only the sentence currently being "spoken" so captions advance
  // line-by-line instead of dumping the whole paragraph at once.
  const lastSentence = (text: string) => {
    const parts = text
      .split(/(?<=[。！？!?.])\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts[parts.length - 1] ?? text;
  };

  const swapStage = () =>
    setMainStage((s) => (s === "self" ? "interviewer" : "self"));

  // ---- camera ----
  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamState("granted");
    } catch {
      setCamState("denied");
    }
  }, []);

  useEffect(() => {
    requestCamera();
    return () => streamRef.current?.getTracks().forEach((tr) => tr.stop());
  }, [requestCamera]);

  // toggle camera track
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((tr) => (tr.enabled = camOn));
  }, [camOn]);
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((tr) => (tr.enabled = micOn));
  }, [micOn]);

  // Re-attach the camera stream to the main <video> whenever it becomes the
  // big stage (the element remounts on swap and loses its srcObject).
  useEffect(() => {
    if (mainStage === "self" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [mainStage, camState]);

  const pushCaption = (speaker: Caption["speaker"], text: string) => {
    setCaptions((prev) => [...prev.slice(-6), { id: `${speaker}-${Date.now()}`, speaker, text }]);
  };

  // ---- ask next question ----
  const askNext = useCallback(async (answer: string | null) => {
    if (!sessionId) return;
    setPhase("thinking");
    setLiveQuestion("");
    try {
      const result = await streamNextQuestion(
        sessionId, answer, i18n.language,
        (delta) => {
          setPhase("asking");
          setLiveQuestion((p) => p + delta);
        },
      );

      if (result.done && !result.message) {
        setPhase("done");
        setFinishOpen(true);
        return;
      }
      const msg = result.message!;
      setCurrentStage(result.stage ?? null);
      setCompetency(msg.jd_competency ?? null);
      pushCaption("interviewer", msg.content);
      setLiveQuestion("");
      setPhase(result.done ? "done" : "waiting");
      if (result.done) setFinishOpen(true);
    } catch (err) {
      toast.error((err as Error).message);
      setLiveQuestion("");
      setPhase("waiting");
    }
  }, [sessionId, i18n.language]);

  // ---- load task + first question ----
  useEffect(() => {
    if (!sessionId) { navigate("/"); return; }
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      const { data: session } = await supabase
        .from("interview_sessions").select("task_id").eq("id", sessionId).maybeSingle();
      if (!session) { navigate("/"); return; }
      const { data: tk } = await supabase
        .from("interview_tasks").select("*").eq("id", session.task_id).maybeSingle();
      if (!tk) { navigate("/"); return; }
      setTask(tk as InterviewTask);
      await askNext(null);
    })();
  }, [sessionId, navigate, askNext]);

  const submitAnswer = async () => {
    if (!draft.trim() || phase !== "recording") return;
    if (listening) stopSpeech();
    const answer = draft.trim();
    pushCaption("candidate", answer);
    setAnswered((a) => a + 1);
    setDraft("");
    await askNext(answer);
  };

  const finish = async () => {
    if (!sessionId) return;
    setFinishing(true);
    try {
      await finishInterview(sessionId, i18n.language, () => {});
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      navigate(`/feedback?sessionId=${sessionId}`);
    } catch (err) {
      toast.error((err as Error).message);
      setFinishing(false);
    }
  };

  const statusLabel: Record<Phase, string> = {
    connecting: t("video.phase.connecting"),
    asking: t("video.phase.asking"),
    waiting: t("video.phase.waiting"),
    recording: t("video.phase.recording"),
    thinking: t("video.phase.thinking"),
    done: t("video.phase.done"),
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="display text-base">{t("app.name")}</span>
          <span className="hidden text-sm text-neutral-400 sm:inline">
            {task?.job_title ?? "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
            <span className={cn("h-1.5 w-1.5 rounded-full",
              phase === "done" ? "bg-neutral-400" : "animate-pulse-soft bg-emerald-400")} />
            {statusLabel[phase]}
          </span>
          {currentStage && (
            <span className="hidden rounded-full bg-white/10 px-2.5 py-1 sm:inline">{currentStage}</span>
          )}
          <span className="rounded-full bg-white/10 px-2.5 py-1 tabular-nums">{fmtTime(elapsed)}</span>
        </div>
      </header>

      {/* Main stage */}
      <div className="flex flex-1 flex-col gap-4 p-4 lg:flex-row lg:p-6">
        {/* Video column */}
        <div className="relative flex flex-1 flex-col">
          <div className="relative flex-1 overflow-hidden rounded-3xl bg-neutral-900">
            {/* ---- Big stage ---- */}
            {mainStage === "self" ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted
                  className={cn("absolute inset-0 h-full w-full object-cover",
                    (!camOn || camState !== "granted") && "hidden")} />
                {(!camOn || camState !== "granted") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500">
                    <VideoOff className="h-10 w-10" />
                    <span className="text-xs uppercase tracking-wider">
                      {camState === "denied" ? t("video.cam.denied")
                        : camState === "simulated" ? t("video.cam.simulated")
                          : t("video.cam.off")}
                    </span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />
                {/* Self name badge */}
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs backdrop-blur">
                  {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5 text-red-400" />}
                  {t("video.you")}
                </div>
              </>
            ) : (
              <>
                <InterviewerAvatar state={avatarState} className="absolute inset-0 h-full w-full rounded-3xl" />
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  {t("video.interviewerName")}
                </div>
              </>
            )}

            {/* Connecting overlay */}
            {phase === "connecting" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("video.connecting")}
                </div>
              </div>
            )}

            {/* ---- PiP (the other feed) — click to swap ---- */}
            <button
              onClick={swapStage}
              title={t("video.swap")}
              className="group absolute right-4 top-4 aspect-video w-40 overflow-hidden rounded-xl border border-white/20 bg-neutral-800 shadow-lg transition-smooth hover:border-white/50 sm:w-52"
            >
              {mainStage === "self" ? (
                <InterviewerAvatar state={avatarState} className="absolute inset-0 h-full w-full rounded-xl" />
              ) : (
                <>
                  <video
                    autoPlay playsInline muted
                    ref={(el) => {
                      if (el && streamRef.current) el.srcObject = streamRef.current;
                    }}
                    className={cn("h-full w-full object-cover", (!camOn || camState !== "granted") && "hidden")} />
                  {(!camOn || camState !== "granted") && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-500">
                      <VideoOff className="h-5 w-5" />
                    </div>
                  )}
                </>
              )}
              <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px]">
                {mainStage === "self"
                  ? <><Sparkles className="h-2.5 w-2.5 text-emerald-400" />{t("video.interviewerName")}</>
                  : <>{micOn ? <Mic className="h-2.5 w-2.5" /> : <MicOff className="h-2.5 w-2.5 text-red-400" />}{t("video.you")}</>}
              </div>
              <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 opacity-0 transition-smooth group-hover:opacity-100">
                <RefreshCw className="h-3 w-3" />
              </span>
            </button>

            {/* Live captions — one sentence at a time */}
            {captionsOn && (liveQuestion || captions.length > 0) && (
              <div className="absolute inset-x-0 bottom-0 px-6 pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent">
                <div className="mx-auto max-w-3xl space-y-1.5 text-center">
                  {liveQuestion ? (
                    <p className="text-[15px] leading-relaxed">
                      <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        {t("video.interviewerName")}
                      </span>
                      {lastSentence(liveQuestion)}
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse-soft bg-white align-middle" />
                    </p>
                  ) : (
                    captions.slice(-1).map((c) => (
                      <p key={c.id} className="text-[15px] leading-relaxed">
                        <span className={cn("mr-2 text-xs font-semibold uppercase tracking-wider",
                          c.speaker === "interviewer" ? "text-emerald-400" : "text-sky-400")}>
                          {c.speaker === "interviewer" ? t("video.interviewerName") : t("video.you")}
                        </span>
                        {lastSentence(c.text)}
                      </p>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Control bar */}
          <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3">
            <CtrlButton active={micOn} onClick={() => setMicOn((v) => !v)}
              on={<Mic className="h-5 w-5" />} off={<MicOff className="h-5 w-5" />} label={t("video.ctrl.mic")} />
            <CtrlButton active={camOn} onClick={() => setCamOn((v) => !v)}
              on={<Video className="h-5 w-5" />} off={<VideoOff className="h-5 w-5" />} label={t("video.ctrl.cam")} />
            <CtrlButton active={captionsOn} onClick={() => setCaptionsOn((v) => !v)}
              on={<Captions className="h-5 w-5" />} off={<CaptionsOff className="h-5 w-5" />} label={t("video.ctrl.captions")} />
            <CtrlButton active={!paused} onClick={() => setPaused((v) => !v)}
              on={<Pause className="h-5 w-5" />} off={<Play className="h-5 w-5" />} label={t("video.ctrl.pause")} />
            <button onClick={() => setFinishOpen(true)}
              className="flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-medium text-white transition-smooth hover:bg-red-600">
              <PhoneOff className="h-5 w-5" />
              <span className="hidden sm:inline">{t("video.ctrl.end")}</span>
            </button>
          </div>
        </div>

        {/* Right panel */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-80">
          {/* Current question / answer console */}
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
              <Target className="h-3.5 w-3.5" />{t("video.panel.current")}
            </div>
            <p className="min-h-[48px] text-sm leading-relaxed text-neutral-200">
              {liveQuestion || captions.filter((c) => c.speaker === "interviewer").slice(-1)[0]?.text || "—"}
            </p>

            {/* Answer console */}
            <div className="mt-4 border-t border-white/10 pt-4">
              {phase === "waiting" && (
                <Button onClick={() => { setPhase("recording"); if (speechSupported) startSpeech(); }} className="w-full rounded-full bg-white text-neutral-900 hover:bg-neutral-200">
                  <Circle className="mr-2 h-3.5 w-3.5 fill-red-500 text-red-500" />{t("video.answer.start")}
                </Button>
              )}
              {phase === "recording" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-red-500" />
                      {t("video.answer.recording")}
                    </div>
                    {speechSupported && (
                      <button
                        onClick={() => (listening ? stopSpeech() : startSpeech())}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-smooth",
                          listening
                            ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                            : "bg-white/10 text-neutral-200 hover:bg-white/20",
                        )}>
                        {listening
                          ? <><Square className="h-3 w-3 fill-current" />{t("video.voice.stop")}</>
                          : <><Mic className="h-3.5 w-3.5" />{t("video.voice.start")}</>}
                      </button>
                    )}
                  </div>

                  {listening && (
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-neutral-400">
                      <span className="flex gap-0.5">
                        <span className="h-3 w-0.5 animate-pulse-soft rounded-full bg-emerald-400" />
                        <span className="h-3 w-0.5 animate-pulse-soft rounded-full bg-emerald-400 [animation-delay:120ms]" />
                        <span className="h-3 w-0.5 animate-pulse-soft rounded-full bg-emerald-400 [animation-delay:240ms]" />
                      </span>
                      {interim || t("video.voice.listening")}
                    </div>
                  )}

                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                    placeholder={speechSupported ? t("video.answer.voiceOrType") : t("video.answer.transcribePh")}
                    className="min-h-[120px] resize-none rounded-xl border-white/15 bg-neutral-800 text-neutral-100 placeholder:text-neutral-500" />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { if (listening) stopSpeech(); setDraft(""); }}
                      className="rounded-full text-neutral-400 hover:text-neutral-100">
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />{t("video.answer.retake")}
                    </Button>
                    <Button size="sm" onClick={submitAnswer} disabled={!draft.trim()}
                      className="flex-1 rounded-full bg-white text-neutral-900 hover:bg-neutral-200">
                      <Send className="mr-1.5 h-3.5 w-3.5" />{t("video.answer.submit")}
                    </Button>
                  </div>
                </div>
              )}
              {phase === "thinking" && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" />{t("video.phase.thinking")}
                </div>
              )}
              {phase === "asking" && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Square className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />{t("video.answer.listen")}
                </div>
              )}
              {phase === "done" && (
                <Button onClick={() => setFinishOpen(true)} className="w-full rounded-full bg-white text-neutral-900 hover:bg-neutral-200">
                  {t("video.answer.finish")}
                </Button>
              )}
            </div>
          </div>

          {/* Meta panel */}
          <div className="rounded-2xl border border-white/10 bg-neutral-900 p-5">
            <PanelRow icon={Layers} label={t("interview.stage")} value={currentStage ?? "—"} />
            <PanelRow icon={Target} label={t("interview.competency")} value={competency ?? "—"} />
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
                <span>{t("interview.progress")}</span>
                <span className="tabular-nums text-neutral-200">{t("interview.answered", { count: answered })}</span>
              </div>
              {task && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-neutral-300">{t(dirKey(task.job_direction))}</span>
                  <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-neutral-300">{t(typeKey(task.interview_type))}</span>
                </div>
              )}
            </div>
          </div>
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
    </div>
  );
};

const CtrlButton = ({ active, onClick, on, off, label }: {
  active: boolean; onClick: () => void; on: React.ReactNode; off: React.ReactNode; label: string;
}) => (
  <button onClick={onClick} title={label}
    className={cn(
      "flex h-12 w-12 items-center justify-center rounded-full transition-smooth",
      active ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/90 text-neutral-900 hover:bg-white",
    )}>
    {active ? on : off}
  </button>
);

const PanelRow = ({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) => (
  <div className="flex items-start gap-3 py-2 first:pt-0">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
    <div className="min-w-0">
      <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-neutral-200">{value}</div>
    </div>
  </div>
);

export default VideoInterview;
