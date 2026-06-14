// Deterministic-ish mock generators (no backend / no AI calls).
// They produce plausible, role-aware content so the demo flow feels real.

import { TFunction } from "i18next";
import {
  MockTask,
  MockAnalysis,
  MockFeedback,
  MockMessage,
} from "@/lib/workspaceStore";
import { dirKey } from "@/lib/interview";

const DIRECTION_FOCUS: Record<string, string[]> = {
  ai_pm: [
    "AI product judgment",
    "Eval & quality metrics",
    "Roadmap & prioritization",
    "Cross-functional delivery",
    "Cost & latency tradeoffs",
  ],
  ai_engineer: [
    "LLM application design",
    "RAG & retrieval quality",
    "Evaluation & testing",
    "System reliability",
    "Cost & latency tradeoffs",
  ],
  prompt_engineer: [
    "Prompt design & iteration",
    "Eval-driven optimization",
    "Failure-mode analysis",
    "Tooling & automation",
    "Communication of results",
  ],
  ai_gtm: [
    "Solution storytelling",
    "Technical credibility",
    "Discovery & qualification",
    "ROI & value framing",
    "Stakeholder management",
  ],
};

function pick<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

function scoreFrom(task: MockTask): number {
  // Stable pseudo score from input length + difficulty.
  const base = 58 + ((task.jdText.length + task.resumeText.length) % 30);
  const adj = task.difficulty === "stress" ? -6 : 4;
  return Math.max(45, Math.min(92, base + adj));
}

export function generateAnalysis(task: MockTask, t: TFunction): MockAnalysis {
  const role = t(dirKey(task.jobDirection));
  const focus = DIRECTION_FOCUS[task.jobDirection] ?? DIRECTION_FOCUS.ai_pm;

  return {
    matchScore: scoreFrom(task),
    jd: {
      positioning: t("mock.jd.positioning", { role }),
      coreResponsibilities: [
        t("mock.jd.core1", { role }),
        t("mock.jd.core2"),
        t("mock.jd.core3"),
      ],
      mustHave: [t("mock.jd.must1"), t("mock.jd.must2"), t("mock.jd.must3")],
      niceToHave: [t("mock.jd.nice1"), t("mock.jd.nice2")],
      aiFocus: pick(focus, 4),
      implicit: [t("mock.jd.implicit1"), t("mock.jd.implicit2")],
    },
    resume: {
      sellingPoints: [t("mock.resume.sell1"), t("mock.resume.sell2")],
      matched: [t("mock.resume.match1"), t("mock.resume.match2")],
      gaps: [t("mock.resume.gap1"), t("mock.resume.gap2")],
      probePoints: [t("mock.resume.probe1"), t("mock.resume.probe2")],
      evidence: [t("mock.resume.ev1"), t("mock.resume.ev2")],
    },
    strongMatches: [t("mock.match.strong1"), t("mock.match.strong2")],
    weakMatches: [t("mock.match.weak1"), t("mock.match.weak2")],
    riskPoints: [t("mock.match.risk1")],
    advice: [t("mock.match.advice1"), t("mock.match.advice2")],
    plan: [
      { stage: t("mock.plan.s1"), minutes: 5, focus: t("mock.plan.s1f") },
      { stage: t("mock.plan.s2"), minutes: 12, focus: t("mock.plan.s2f") },
      { stage: t("mock.plan.s3"), minutes: 10, focus: t("mock.plan.s3f") },
      { stage: t("mock.plan.s4"), minutes: 3, focus: t("mock.plan.s4f") },
    ],
  };
}

// Scripted interviewer questions (5 total). Each maps to a competency + stage.
export function interviewQuestions(task: MockTask, t: TFunction): MockMessage[] {
  const focus = DIRECTION_FOCUS[task.jobDirection] ?? DIRECTION_FOCUS.ai_pm;
  const defs = [
    { key: "q1", stage: t("mock.plan.s1"), comp: focus[0] },
    { key: "q2", stage: t("mock.plan.s2"), comp: focus[1] },
    { key: "q3", stage: t("mock.plan.s2"), comp: focus[2] },
    { key: "q4", stage: t("mock.plan.s3"), comp: focus[3] ?? focus[0] },
    { key: "q5", stage: t("mock.plan.s4"), comp: focus[4] ?? focus[1] },
  ];
  return defs.map((d, i) => ({
    id: `iv-${i}`,
    role: "interviewer" as const,
    content: t(`mock.iv.${d.key}`),
    competency: d.comp,
    stage: d.stage,
  }));
}

export function generateFeedback(
  task: MockTask,
  messages: MockMessage[],
  t: TFunction,
): MockFeedback {
  const focus = DIRECTION_FOCUS[task.jobDirection] ?? DIRECTION_FOCUS.ai_pm;
  const answered = messages.filter((m) => m.role === "candidate");
  const avgLen =
    answered.reduce((s, m) => s + m.content.length, 0) /
    Math.max(answered.length, 1);
  const baseGrade = avgLen > 220 ? "A-" : avgLen > 120 ? "B+" : "B";

  const abilityScores = focus.map((name, i) => ({
    name,
    score: Math.max(5, Math.min(9, 6 + ((Math.round(avgLen) + i) % 4))),
  }));

  const questions = messages.filter((m) => m.role === "interviewer");

  return {
    grade: baseGrade,
    overview: t("mock.fb.overview"),
    abilityScores,
    strengths: [t("mock.fb.strength1"), t("mock.fb.strength2")],
    weaknesses: [t("mock.fb.weak1"), t("mock.fb.weak2")],
    riskAnswers: [t("mock.fb.risk1")],
    questionFeedback: questions.slice(0, 3).map((q) => ({
      question: q.content,
      problems: [t("mock.fb.prob1"), t("mock.fb.prob2")],
      direction: [t("mock.fb.dir1"), t("mock.fb.dir2")],
    })),
    optimizedAnswers: questions.slice(0, 2).map((q) => ({
      question: q.content,
      answer: t("mock.fb.optAnswer"),
    })),
    practicePlan: [
      t("mock.fb.practice1"),
      t("mock.fb.practice2"),
      t("mock.fb.practice3"),
    ],
  };
}
