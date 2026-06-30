import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_0f04393eb471")!;
const API_BASE = "https://api.enter.pro/code/api/v1/ai";
const MODEL = "deepseek/deepseek-v4-pro";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const enc = new TextEncoder();

function jsonRes(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

type Msg = { role: string; content: string };

async function llmChat(messages: Msg[], jsonMode = false): Promise<string> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content as string) ?? "";
}

async function* llmStream(messages: Msg[]): AsyncGenerator<string> {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AI_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true }),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const d = t.slice(5).trim();
      if (d === "[DONE]") return;
      try {
        const delta = JSON.parse(d)?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch { /* ignore */ }
    }
  }
}

function lang(code: string) {
  return code.startsWith("zh") ? "Chinese" : "English";
}

// ---- suggest_config ----
async function suggestConfig(body: Record<string, unknown>) {
  const { jdText, resumeText, lang: l } = body as { jdText: string; resumeText: string; lang: string };
  const content = await llmChat([
    { role: "system", content: "You are an expert interview coach. Return valid JSON only." },
    {
      role: "user",
      content: `Analyze the JD and resume, suggest an optimal mock-interview config.

JD:
${jdText}

Resume:
${resumeText}

Return JSON in ${lang(l)}:
{
  "job_title": "exact title from JD",
  "job_direction": "ai_pm | ai_engineer | prompt_engineer | ai_gtm | or free text",
  "interview_type": "product | technical | business | hr | founder",
  "difficulty": "normal | stress",
  "duration": 15 or 30
}`,
    },
  ], true);
  return jsonRes({ config: JSON.parse(content) });
}

// ---- analyze ----
async function analyze(body: Record<string, unknown>, userId: string, sb: ReturnType<typeof createClient>) {
  const { taskId, lang: l } = body as { taskId: string; lang: string };
  const { data: task } = await sb.from("interview_tasks").select("*").eq("id", taskId).eq("user_id", userId).maybeSingle();
  if (!task) return jsonRes({ error: "Task not found" }, 404);

  const content = await llmChat([
    { role: "system", content: "You are an expert AI-industry interview coach. Return only valid JSON." },
    {
      role: "user",
      content: `Analyze this JD and resume for a ${task.interview_type} mock interview (${task.difficulty}, ${task.duration} min).

JD:
${task.jd_text}

Resume:
${task.resume_text}

Return in ${lang(l)}:
{
  "jd_analysis": {
    "positioning": "...",
    "core_responsibilities": ["..."],
    "must_have": ["..."],
    "nice_to_have": ["..."],
    "ai_focus_points": ["..."],
    "implicit_requirements": ["..."],
    "interview_focus": ["..."],
    "competency_weights": [{"name":"...","weight":30}]
  },
  "resume_analysis": {
    "selling_points": ["..."],
    "matched_experience": ["..."],
    "gaps": ["..."],
    "risks": ["..."],
    "probe_points": ["..."],
    "evidence_to_prepare": ["..."]
  },
  "match_score": 75,
  "strong_matches": ["..."],
  "weak_matches": ["..."],
  "risk_points": ["..."],
  "interview_plan": {
    "advice": ["..."],
    "plan": [{"stage":"Warm-up","minutes":5,"focus":"..."}]
  }
}`,
    },
  ], true);

  const report = JSON.parse(content);
  const { data: saved } = await sb.from("analysis_reports").insert({
    task_id: taskId,
    user_id: userId,
    jd_analysis: report.jd_analysis,
    resume_analysis: report.resume_analysis,
    match_score: report.match_score,
    strong_matches: report.strong_matches,
    weak_matches: report.weak_matches,
    risk_points: report.risk_points,
    interview_plan: report.interview_plan,
  }).select("*").single();
  await sb.from("interview_tasks").update({ status: "analyzed" }).eq("id", taskId);
  return jsonRes({ report: saved });
}

// ---- interview_next (SSE) ----
async function interviewNext(body: Record<string, unknown>, userId: string, sb: ReturnType<typeof createClient>) {
  const { sessionId, answer, lang: l } = body as { sessionId: string; answer: string | null; lang: string };

  const { data: session } = await sb
    .from("interview_sessions")
    .select("*, interview_tasks(job_title, interview_type, difficulty, duration, jd_text)")
    .eq("id", sessionId).eq("user_id", userId).maybeSingle();
  if (!session) return jsonRes({ error: "Session not found" }, 404);

  const task = (session as Record<string, unknown>).interview_tasks as Record<string, unknown>;
  const duration = (task.duration as number) ?? 30;
  const maxQ = duration <= 15 ? 5 : 8;
  const qCount = (session.question_count as number) ?? 0;

  if (qCount >= maxQ) return jsonRes({ done: true, capped: true });

  const { data: msgs } = await sb
    .from("interview_messages").select("*")
    .eq("session_id", sessionId).order("created_at", { ascending: true });

  const history: Msg[] = (msgs ?? []).map((m: Record<string, unknown>) => ({
    role: m.role === "interviewer" ? "assistant" : "user",
    content: m.content as string,
  }));

  if (answer && answer.trim()) {
    await sb.from("interview_messages").insert({
      session_id: sessionId, user_id: userId, role: "user", content: answer.trim(),
    });
    history.push({ role: "user", content: answer.trim() });
  }

  const isDone = qCount + 1 >= maxQ;
  const stage = qCount === 0 ? "warm_up" : isDone ? "wrap_up" : "core_competency";

  const system = `You are a professional AI-industry interviewer. Role: ${task.job_title}, type: ${task.interview_type}.
Stage: ${stage} — question ${qCount + 1} of ${maxQ}.
Difficulty: ${task.difficulty === "stress" ? "high-pressure stress interview" : "professional standard interview"}.
JD context: ${String(task.jd_text).slice(0, 600)}
Ask ONE focused question in ${lang(l)}. No preamble. Just the question.${isDone ? " Make it a wrap-up / reflective question." : ""}`;

  const readable = new ReadableStream({
    async start(ctrl) {
      let content = "";
      try {
        for await (const delta of llmStream([{ role: "system", content: system }, ...history])) {
          content += delta;
          ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ type: "delta", text: delta })}\n\n`));
        }
        const { data: savedMsg } = await sb.from("interview_messages").insert({
          session_id: sessionId, user_id: userId,
          role: "interviewer", content, question_type: stage, jd_competency: stage,
        }).select("*").single();
        await sb.from("interview_sessions").update({
          question_count: qCount + 1, current_stage: stage,
        }).eq("id", sessionId);
        ctrl.enqueue(enc.encode(
          `data: ${JSON.stringify({ type: "done", message: savedMsg, stage, done: isDone })}\n\n`
        ));
      } catch (e) {
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", error: String(e) })}\n\n`));
      }
      ctrl.close();
    },
  });

  return new Response(readable, {
    headers: { ...CORS, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}

// ---- finish ----
async function finish(body: Record<string, unknown>, userId: string, sb: ReturnType<typeof createClient>) {
  const { sessionId, lang: l } = body as { sessionId: string; lang: string };

  const { data: session } = await sb
    .from("interview_sessions")
    .select("*, interview_tasks(job_title, interview_type, difficulty)")
    .eq("id", sessionId).eq("user_id", userId).maybeSingle();
  if (!session) return jsonRes({ error: "Session not found" }, 404);

  const { data: msgs } = await sb.from("interview_messages").select("*")
    .eq("session_id", sessionId).order("created_at", { ascending: true });

  const task = (session as Record<string, unknown>).interview_tasks as Record<string, unknown>;
  const conversation = (msgs ?? [])
    .map((m: Record<string, unknown>) =>
      `${m.role === "interviewer" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const content = await llmChat([
    { role: "system", content: "You are an expert interview evaluator. Return only valid JSON." },
    {
      role: "user",
      content: `Evaluate this ${task.interview_type} interview for the role: ${task.job_title} (${task.difficulty}).

Conversation:
${conversation}

Return comprehensive feedback in ${lang(l)}:
{
  "summary": {
    "grade": "A | B+ | B | C+ | C | D",
    "overview": "2-3 sentence overall assessment"
  },
  "ability_scores": [
    {"name": "Communication", "score": 75},
    {"name": "Product Thinking", "score": 80},
    {"name": "Technical Understanding", "score": 70},
    {"name": "Business Acumen", "score": 65},
    {"name": "AI Knowledge", "score": 85},
    {"name": "Problem Solving", "score": 72},
    {"name": "Leadership", "score": 68},
    {"name": "Execution", "score": 78}
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "risk_answers": ["risky answer description"],
  "question_feedback": [
    {"question": "...", "problems": ["..."], "direction": ["..."]}
  ],
  "optimized_answers": [
    {"question": "...", "answer": "ideal answer example"}
  ],
  "practice_plan": ["tip1", "tip2", "tip3"]
}`,
    },
  ], true);

  const report = JSON.parse(content);
  const { data: saved } = await sb.from("feedback_reports").insert({
    session_id: sessionId, user_id: userId,
    summary: report.summary,
    ability_scores: report.ability_scores,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    risk_answers: report.risk_answers,
    question_feedback: report.question_feedback,
    optimized_answers: report.optimized_answers,
    practice_plan: report.practice_plan,
  }).select("*").single();

  await sb.from("interview_sessions").update({
    status: "completed",
    ended_at: new Date().toISOString(),
    overall_score: report.summary?.grade ?? null,
  }).eq("id", sessionId);

  return jsonRes({ report: saved });
}

// ---- Main ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return jsonRes({ error: "Unauthorized" }, 401);

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !user) return jsonRes({ error: "Unauthorized" }, 401);

  try {
    const body = await req.json() as Record<string, unknown>;
    switch (body.action) {
      case "suggest_config":  return suggestConfig(body);
      case "analyze":         return analyze(body, user.id, sb);
      case "interview_next":  return interviewNext(body, user.id, sb);
      case "finish":          return finish(body, user.id, sb);
      default:                return jsonRes({ error: `Unknown action: ${body.action}` }, 400);
    }
  } catch (e) {
    console.error("interview-agent error:", e);
    return jsonRes({ error: String(e) }, 500);
  }
});
