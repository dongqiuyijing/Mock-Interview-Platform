// Frontend-only mock workspace store (no backend).
// Persists the current run in localStorage so the linear flow
// / -> /analysis -> /interview -> /feedback stays stable across navigations.

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
}

export interface MockFeedback {
  grade: string;
  overview: string;
  abilityScores: { name: string; score: number }[];
  strengths: string[];
  weaknesses: string[];
  riskAnswers: string[];
  questionFeedback: { question: string; problems: string[]; direction: string[] }[];
  optimizedAnswers: { question: string; answer: string }[];
  practicePlan: string[];
}

const KEYS = {
  task: "rr.task",
  analysis: "rr.analysis",
  messages: "rr.messages",
  feedback: "rr.feedback",
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

export const store = {
  getTask: () => read<MockTask>(KEYS.task),
  setTask: (t: MockTask) => write(KEYS.task, t),

  getAnalysis: () => read<MockAnalysis>(KEYS.analysis),
  setAnalysis: (a: MockAnalysis) => write(KEYS.analysis, a),

  getMessages: () => read<MockMessage[]>(KEYS.messages) ?? [],
  setMessages: (m: MockMessage[]) => write(KEYS.messages, m),

  getFeedback: () => read<MockFeedback>(KEYS.feedback),
  setFeedback: (f: MockFeedback) => write(KEYS.feedback, f),

  // Reset only the conversation + downstream output (used when (re)starting interview).
  resetInterview: () => {
    localStorage.removeItem(KEYS.messages);
    localStorage.removeItem(KEYS.feedback);
  },

  clearAll: () => {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  },
};
