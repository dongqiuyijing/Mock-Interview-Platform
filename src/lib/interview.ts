// Shared option constants and TS types for the mock-interview app.

export type JobDirection = "ai_pm" | "ai_engineer" | "prompt_engineer" | "ai_gtm";
export type InterviewType = "product" | "technical" | "business" | "hr" | "founder";
export type Difficulty = "normal" | "stress";

export const JOB_DIRECTIONS: { value: JobDirection; labelKey: string }[] = [
  { value: "ai_pm", labelKey: "dir.aiPm" },
  { value: "ai_engineer", labelKey: "dir.aiEngineer" },
  { value: "prompt_engineer", labelKey: "dir.promptEngineer" },
  { value: "ai_gtm", labelKey: "dir.aiGtm" },
];

// Map DB enum value -> camelCase translation key (keys can't contain underscores).
export const dirKey = (d: JobDirection): string =>
  ({
    ai_pm: "dir.aiPm",
    ai_engineer: "dir.aiEngineer",
    prompt_engineer: "dir.promptEngineer",
    ai_gtm: "dir.aiGtm",
  })[d] ?? "dir.aiPm";

export const typeKey = (v: InterviewType): string => `itype.${v}`;
export const difficultyKey = (v: Difficulty): string => `difficulty.${v}`;
export const statusKey = (v: string): string =>
  ({
    created: "status.created",
    analyzed: "status.analyzed",
    interviewing: "status.interviewing",
    completed: "status.completed",
  })[v] ?? "status.created";

export const INTERVIEW_TYPES: { value: InterviewType; labelKey: string }[] = [
  { value: "product", labelKey: "itype.product" },
  { value: "technical", labelKey: "itype.technical" },
  { value: "business", labelKey: "itype.business" },
  { value: "hr", labelKey: "itype.hr" },
  { value: "founder", labelKey: "itype.founder" },
];

export const DIFFICULTIES: { value: Difficulty; labelKey: string }[] = [
  { value: "normal", labelKey: "difficulty.normal" },
  { value: "stress", labelKey: "difficulty.stress" },
];

export const DURATIONS = [15, 30];

// ---- DB row shapes (subset used by UI) ----
export interface InterviewTask {
  id: string;
  user_id: string;
  job_title: string;
  job_direction: JobDirection;
  interview_type: InterviewType;
  difficulty: Difficulty;
  duration: number;
  jd_text: string;
  resume_text: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AnalysisReport {
  id: string;
  task_id: string;
  jd_analysis: {
    positioning?: string;
    core_responsibilities?: string[];
    must_have?: string[];
    nice_to_have?: string[];
    ai_focus_points?: string[];
    implicit_requirements?: string[];
    interview_focus?: string[];
    competency_weights?: { name: string; weight: number }[];
  } | null;
  resume_analysis: {
    selling_points?: string[];
    matched_experience?: string[];
    gaps?: string[];
    risks?: string[];
    probe_points?: string[];
    evidence_to_prepare?: string[];
  } | null;
  match_score: number | null;
  strong_matches: string[] | null;
  weak_matches: string[] | null;
  risk_points: string[] | null;
  interview_plan: {
    advice?: string[];
    plan?: { stage: string; minutes: number; focus: string }[];
  } | null;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  task_id: string;
  status: string;
  current_stage: string | null;
  question_count: number;
  overall_score: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface InterviewMessage {
  id: string;
  session_id: string;
  role: "interviewer" | "candidate";
  content: string;
  question_type: string | null;
  jd_competency: string | null;
  created_at: string;
}

export interface FeedbackReport {
  id: string;
  session_id: string;
  summary: { grade?: string; overview?: string } | null;
  ability_scores: { name: string; score: number }[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  risk_answers: string[] | null;
  question_feedback: { question: string; problems: string[]; direction: string[] }[] | null;
  optimized_answers: { question: string; answer: string }[] | null;
  practice_plan: string[] | null;
  created_at: string;
}
