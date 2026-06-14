import { supabase } from "@/integrations/supabase/client";
import {
  AnalysisReport,
  FeedbackReport,
  InterviewMessage,
  JobDirection,
  InterviewType,
  Difficulty,
  InterviewMode,
} from "@/lib/interview";

const FN_URL =
  "https://spb-t4nv7v8lc2v8ud5v.supabase.opentrust.net/functions/v1/interview-agent";

export interface NewTaskInput {
  jobTitle: string;
  jobDirection: JobDirection;
  interviewType: InterviewType;
  difficulty: Difficulty;
  duration: number;
  jdText: string;
  resumeText: string;
  mode?: InterviewMode;
}

// Insert a task row, returning its id.
export async function createTask(input: NewTaskInput): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("interview_tasks")
    .insert({
      user_id: user.id,
      job_title: input.jobTitle,
      job_direction: input.jobDirection,
      interview_type: input.interviewType,
      difficulty: input.difficulty,
      duration: input.duration,
      jd_text: input.jdText,
      resume_text: input.resumeText,
      mode: input.mode ?? "text",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Run JD + resume + match analysis (buffered). Returns the analysis report.
export async function analyzeTask(
  taskId: string,
  lang: string,
): Promise<AnalysisReport> {
  const { data, error } = await supabase.functions.invoke("interview-agent", {
    body: { action: "analyze", taskId, lang },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.report as AnalysisReport;
}

export async function getTask(taskId: string) {
  const { data, error } = await supabase
    .from("interview_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAnalysis(
  taskId: string,
): Promise<AnalysisReport | null> {
  const { data, error } = await supabase
    .from("analysis_reports")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as AnalysisReport | null;
}

// Create a new interview session for a task, returning its id.
export async function createSession(
  taskId: string,
  mode: InterviewMode = "text",
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({ task_id: taskId, user_id: user.id, status: "active", mode })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export interface StreamResult {
  message?: InterviewMessage;
  stage?: string | null;
  done: boolean;
  capped?: boolean;
}

// Stream the next interviewer question. onDelta receives incremental text.
export async function streamNextQuestion(
  sessionId: string,
  answer: string | null,
  lang: string,
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "interview_next",
      sessionId,
      answer,
      lang,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `request failed: ${res.status}`);
  }

  const ct = res.headers.get("Content-Type") ?? "";
  // capped / done short-circuit returns plain JSON
  if (ct.includes("application/json")) {
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return { done: !!json.done, capped: json.capped };
  }

  const evt = await consumeSse(res, onDelta);
  return {
    message: evt.message as InterviewMessage | undefined,
    stage: (evt.stage as string | null) ?? null,
    done: !!evt.done,
  };
}

// Stream feedback generation. onDelta streams the overview text.
export async function finishInterview(
  sessionId: string,
  lang: string,
  onDelta: (text: string) => void,
): Promise<FeedbackReport> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "finish", sessionId, lang }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `request failed: ${res.status}`);
  }

  const ct = res.headers.get("Content-Type") ?? "";
  if (ct.includes("application/json")) {
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.report as FeedbackReport;
  }

  const result = await consumeSse(res, onDelta);
  return result.report as FeedbackReport;
}

export async function getFeedback(
  sessionId: string,
): Promise<FeedbackReport | null> {
  const { data, error } = await supabase
    .from("feedback_reports")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data as FeedbackReport | null;
}

// ---- Real per-user dashboard / history / skills data ----

export interface UserSessionRecord {
  sessionId: string;
  date: string;
  mode: string;
  jobTitle: string;
  jobDirection: string;
  interviewType: string;
  grade: string;
  score: number; // 0-100, averaged from ability scores
  strengths: string[];
  weaknesses: string[];
  abilityScores: { name: string; score: number }[];
}

export interface AbilityStat {
  name: string;
  current: number;
  delta: number;
}

export interface UserStats {
  sessions: UserSessionRecord[];
  readiness: number | null;
  abilities: AbilityStat[];
  lastScore: number | null;
  improvement: number | null;
}

const avg = (nums: number[]) =>
  nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

// Fetch all completed interview sessions for the current user with their
// task + feedback data, newest first.
export async function getUserSessions(): Promise<UserSessionRecord[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      "id, mode, started_at, ended_at, status, " +
        "interview_tasks(job_title, job_direction, interview_type), " +
        "feedback_reports(summary, ability_scores, strengths, weaknesses)",
    )
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("started_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? [])
    .map((s: Record<string, unknown>): UserSessionRecord | null => {
      const task = (Array.isArray(s.interview_tasks)
        ? s.interview_tasks[0]
        : s.interview_tasks) as Record<string, unknown> | null;
      const fbRaw = Array.isArray(s.feedback_reports)
        ? s.feedback_reports[0]
        : s.feedback_reports;
      const fb = fbRaw as Record<string, unknown> | null;
      if (!fb) return null; // no report yet — skip

      const ability = (fb.ability_scores as { name: string; score: number }[]) ?? [];
      const summary = (fb.summary as { grade?: string }) ?? {};
      return {
        sessionId: s.id as string,
        date: (s.ended_at as string) ?? (s.started_at as string),
        mode: (s.mode as string) ?? "text",
        jobTitle: (task?.job_title as string) ?? "—",
        jobDirection: (task?.job_direction as string) ?? "",
        interviewType: (task?.interview_type as string) ?? "",
        grade: summary.grade ?? "—",
        score: avg(ability.map((a) => a.score)),
        strengths: (fb.strengths as string[]) ?? [],
        weaknesses: (fb.weaknesses as string[]) ?? [],
        abilityScores: ability,
      };
    })
    .filter((r): r is UserSessionRecord => r !== null);

  return rows;
}

// Aggregate per-user stats for the dashboard and skills pages.
export async function getUserStats(): Promise<UserStats> {
  const sessions = await getUserSessions();
  if (sessions.length === 0) {
    return { sessions, readiness: null, abilities: [], lastScore: null, improvement: null };
  }

  // Aggregate abilities by name: current = most recent value, delta = most
  // recent minus the previous occurrence.
  const byName = new Map<string, number[]>(); // newest-first values
  for (const s of sessions) {
    for (const a of s.abilityScores) {
      const arr = byName.get(a.name) ?? [];
      arr.push(a.score);
      byName.set(a.name, arr);
    }
  }
  const abilities: AbilityStat[] = [...byName.entries()].map(([name, vals]) => ({
    name,
    current: vals[0],
    delta: vals.length > 1 ? vals[0] - vals[1] : 0,
  }));

  const readiness = abilities.length
    ? avg(abilities.map((a) => a.current))
    : avg(sessions.map((s) => s.score));
  const lastScore = sessions[0].score;
  const improvement =
    sessions.length > 1 ? sessions[0].score - sessions[1].score : null;

  return { sessions, readiness, abilities, lastScore, improvement };
}

// Generic SSE consumer for the edge function. Returns the payload of the
// terminal "done" event.
type SseEvent = {
  type: string;
  text?: string;
  error?: string;
  [key: string]: unknown;
};

async function consumeSse(
  res: Response,
  onDelta: (text: string) => void,
): Promise<Record<string, unknown>> {
  if (!res.body) throw new Error("no response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: Record<string, unknown> = { done: false };

  const handle = (raw: string) => {
    const t = raw.trim();
    if (!t) return;
    let evt: SseEvent;
    try {
      evt = JSON.parse(t) as SseEvent;
    } catch {
      return;
    }
    if (evt.type === "delta" && typeof evt.text === "string") {
      onDelta(evt.text);
    } else if (evt.type === "error") {
      throw new Error(evt.error || "stream error");
    } else if (evt.type === "done") {
      result = evt;
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const l = line.trim();
      if (l.startsWith("data:")) handle(l.slice(5));
    }
  }
  if (buffer.trim().startsWith("data:")) handle(buffer.trim().slice(5));

  return result;
}
