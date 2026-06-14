// Frontend-only mock workspace store (no backend).
// Persists the current run + training history in localStorage.

import {
  JobDirection,
  InterviewType,
  Difficulty,
} from "@/lib/interview";

export interface MockTask {
  jobTitle: string;
  jobDirection: JobDirection;
  interviewType: InterviewType;
  duration: number;
  difficulty: Difficulty;
  jdText: string;
  resumeText: string;
  createdAt: string;
}

export interface MockAnalysis {
  matchScore: number;
  jd: {
    positioning: string;
    coreResponsibilities: string[];
    mustHave: string[];
    niceToHave: string[];
    aiFocus: string[];
    implicit: string[];
  };
  resume: {
    sellingPoints: string[];
    matched: string[];
    gaps: string[];
    probePoints: string[];
    evidence: string[];
  };
  strongMatches: string[];
  weakMatches: string[];
  riskPoints: string[];
  advice: string[];
  plan: { stage: string; minutes: number; focus: string }[];
}

export interface MockMessage {
  id: string;
  role: "interviewer" | "candidate";
  content: string;
  competency?: string;
  stage?: string;
  intent?: string;
}

export interface MockFeedback {
  grade: string;
  score: number;
  overview: string;
  abilityScores: { name: string; score: number }[];
  strengths: string[];
  weaknesses: string[];
  riskAnswers: string[];
  questionFeedback: { question: string; problems: string[]; direction: string[] }[];
  optimizedAnswers: { question: string; answer: string }[];
  practicePlan: string[];
  topImprovements: string[];
  nextDirections: string[];
  followUps: string[];
}

// ---- v2 training-workbench types ----

export interface SessionRecord {
  id: string;
  jobTitle: string;
  jobDirection: JobDirection;
  interviewType: InterviewType;
  date: string; // ISO
  score: number; // 0-100
  grade: string;
  strengths: string[];
  weaknesses: string[];
}

// 8 AI-industry interview ability dimensions. Scale 0-100.
export interface SkillDimension {
  key: string; // i18n key suffix, e.g. "aiProduct"
  current: number;
  delta: number; // change after the most recent session
}

export interface TrainingDay {
  id: string;
  day: number; // 1..7
  themeKey: string;
  exerciseKey: string;
  abilityKey: string; // skill.* suffix
  done: boolean;
}

const KEYS = {
  task: "rr.task",
  analysis: "rr.analysis",
  messages: "rr.messages",
  feedback: "rr.feedback",
  sessions: "rr.sessions",
  skills: "rr.skills",
  plan: "rr.plan",
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---- Seeds (used on first load) ----

const SKILL_KEYS = [
  "aiProduct",
  "technical",
  "business",
  "metrics",
  "promptAgent",
  "evaluation",
  "communication",
  "structure",
] as const;

function seedSkills(): SkillDimension[] {
  const base = [62, 48, 55, 44, 58, 51, 67, 60];
  const delta = [4, 6, 2, 8, 3, 5, 1, 4];
  return SKILL_KEYS.map((key, i) => ({ key, current: base[i], delta: delta[i] }));
}

function seedSessions(): SessionRecord[] {
  const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
  return [
    {
      id: "seed-1", jobTitle: "Senior AI Product Manager", jobDirection: "ai_pm",
      interviewType: "product", date: day(2), score: 78, grade: "B+",
      strengths: ["mock.match.strong1", "mock.fb.strength2"],
      weaknesses: ["mock.fb.weak1"],
    },
    {
      id: "seed-2", jobTitle: "AI Application Engineer", jobDirection: "ai_engineer",
      interviewType: "technical", date: day(6), score: 71, grade: "B",
      strengths: ["mock.fb.strength1"],
      weaknesses: ["mock.fb.weak2", "mock.match.weak1"],
    },
    {
      id: "seed-3", jobTitle: "AI Solution Consultant", jobDirection: "ai_gtm",
      interviewType: "business", date: day(11), score: 64, grade: "B-",
      strengths: ["mock.resume.sell1"],
      weaknesses: ["mock.match.weak2"],
    },
  ];
}

function seedPlan(): TrainingDay[] {
  const items: Omit<TrainingDay, "id" | "day" | "done">[] = [
    { themeKey: "plan.t1", exerciseKey: "plan.e1", abilityKey: "metrics" },
    { themeKey: "plan.t2", exerciseKey: "plan.e2", abilityKey: "technical" },
    { themeKey: "plan.t3", exerciseKey: "plan.e3", abilityKey: "business" },
    { themeKey: "plan.t4", exerciseKey: "plan.e4", abilityKey: "promptAgent" },
    { themeKey: "plan.t5", exerciseKey: "plan.e5", abilityKey: "evaluation" },
    { themeKey: "plan.t6", exerciseKey: "plan.e6", abilityKey: "structure" },
    { themeKey: "plan.t7", exerciseKey: "plan.e7", abilityKey: "communication" },
  ];
  return items.map((it, i) => ({ ...it, id: `plan-${i + 1}`, day: i + 1, done: i === 0 }));
}

export const SKILL_DIMENSION_KEYS = SKILL_KEYS;

export const store = {
  // ---- current run ----
  getTask: () => read<MockTask>(KEYS.task),
  setTask: (t: MockTask) => write(KEYS.task, t),

  getAnalysis: () => read<MockAnalysis>(KEYS.analysis),
  setAnalysis: (a: MockAnalysis) => write(KEYS.analysis, a),

  getMessages: () => read<MockMessage[]>(KEYS.messages) ?? [],
  setMessages: (m: MockMessage[]) => write(KEYS.messages, m),

  getFeedback: () => read<MockFeedback>(KEYS.feedback),
  setFeedback: (f: MockFeedback) => write(KEYS.feedback, f),

  resetInterview: () => {
    localStorage.removeItem(KEYS.messages);
    localStorage.removeItem(KEYS.feedback);
  },

  // Clear only the active run (keeps history / skills / plan).
  clearRun: () => {
    localStorage.removeItem(KEYS.task);
    localStorage.removeItem(KEYS.analysis);
    localStorage.removeItem(KEYS.messages);
    localStorage.removeItem(KEYS.feedback);
  },

  clearAll: () => {
    localStorage.removeItem(KEYS.task);
    localStorage.removeItem(KEYS.analysis);
    localStorage.removeItem(KEYS.messages);
    localStorage.removeItem(KEYS.feedback);
  },

  // ---- v2: training history ----
  getSessions: (): SessionRecord[] => {
    const existing = read<SessionRecord[]>(KEYS.sessions);
    if (existing) return existing;
    const seeded = seedSessions();
    write(KEYS.sessions, seeded);
    return seeded;
  },
  addSession: (s: SessionRecord) => {
    const all = store.getSessions();
    if (all.some((x) => x.id === s.id)) return;
    write(KEYS.sessions, [s, ...all]);
  },

  // ---- v2: skills ----
  getSkills: (): SkillDimension[] => {
    const existing = read<SkillDimension[]>(KEYS.skills);
    if (existing) return existing;
    const seeded = seedSkills();
    write(KEYS.skills, seeded);
    return seeded;
  },
  bumpSkills: (gains: Record<string, number>) => {
    const skills = store.getSkills().map((s) => {
      const g = gains[s.key] ?? 0;
      return { ...s, current: Math.min(100, s.current + g), delta: g };
    });
    write(KEYS.skills, skills);
    return skills;
  },

  // ---- v2: training plan ----
  getPlan: (): TrainingDay[] => {
    const existing = read<TrainingDay[]>(KEYS.plan);
    if (existing) return existing;
    const seeded = seedPlan();
    write(KEYS.plan, seeded);
    return seeded;
  },
  togglePlanDay: (id: string) => {
    const plan = store.getPlan().map((d) => (d.id === id ? { ...d, done: !d.done } : d));
    write(KEYS.plan, plan);
    return plan;
  },
};
