import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const AGENT_BASE =
  "https://api.enter.pro/code/api/v1/agents/cf516df3-5a89-41a1-9a58-d1796ce1a7ad";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- AG-UI agent caller ----------
async function runAgent(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("AGENT_API_KEY");
  if (!apiKey) throw new Error("AGENT_API_KEY not configured");

  // 1. create thread
  const tr = await fetch(`${AGENT_BASE}/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!tr.ok) throw new Error(`thread create failed: ${await tr.text()}`);
  const threadJson = await tr.json();
  const threadId = threadJson.thread_id ?? threadJson.threadId ?? threadJson.id;

  // 2. run
  const runBody = {
    threadId,
    runId: crypto.randomUUID(),
    messages: [{ id: crypto.randomUUID(), role: "user", content: prompt }],
    tools: [],
    context: [],
    state: {},
    forwardedProps: {},
  };
  const rr = await fetch(`${AGENT_BASE}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(runBody),
  });
  if (!rr.ok || !rr.body)
    throw new Error(`agent run failed: ${await rr.text()}`);

  // 3. parse SSE stream, accumulate text deltas
  const reader = rr.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";

  const handleEvent = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[DONE]") return;
    let evt: any;
    try {
      evt = JSON.parse(trimmed);
    } catch {
      return;
    }
    const type = (evt.type ?? evt.event ?? "").toString().toUpperCase();

    // streaming text deltas (AG-UI TEXT_MESSAGE_CONTENT etc.)
    if (typeof evt.delta === "string") {
      text += evt.delta;
      return;
    }
    if (evt.delta && typeof evt.delta.content === "string") {
      text += evt.delta.content;
      return;
    }
    // some events carry full content
    if (type.includes("TEXT_MESSAGE") && typeof evt.content === "string") {
      text += evt.content;
      return;
    }
    // full snapshot of messages — take last assistant message
    if (
      (type.includes("MESSAGES_SNAPSHOT") || type.includes("STATE_SNAPSHOT")) &&
      Array.isArray(evt.messages)
    ) {
      const last = [...evt.messages]
        .reverse()
        .find((m: any) => m.role === "assistant" && m.content);
      if (last && !text)
        text = typeof last.content === "string"
          ? last.content
          : JSON.stringify(last.content);
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
      if (l.startsWith("data:")) handleEvent(l.slice(5));
      else if (l.startsWith("{")) handleEvent(l);
    }
  }
  if (buffer.trim()) {
    const l = buffer.trim();
    if (l.startsWith("data:")) handleEvent(l.slice(5));
    else if (l.startsWith("{")) handleEvent(l);
  }

  return text.trim();
}

// Extract JSON object from agent text output (handles ```json fences / surrounding prose)
function extractJson(s: string): any {
  if (!s) throw new Error("empty agent response");
  let t = s.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

// ---------- Prompt builders ----------
const DIRECTION_LABELS: Record<string, string> = {
  ai_pm: "AI Product Manager",
  ai_engineer: "AI Application Engineer",
  prompt_engineer: "Prompt Engineer",
  ai_gtm: "AI GTM / Solution Consultant",
};

function langNote(lang: string) {
  return lang === "en"
    ? "Respond in English."
    : "Respond in Simplified Chinese (中文).";
}

function jdAnalystPrompt(task: any, lang: string) {
  return `You are an AI-industry job-description analyst. Analyze the JD and judge what the role truly requires. Pay special attention to AI-industry signals: RAG, Agent, LLM, Eval, AI product delivery, cost, latency, safety, compliance, commercialization.
Target role: ${DIRECTION_LABELS[task.job_direction] ?? task.job_direction}. Interview type: ${task.interview_type}.
${langNote(lang)}
Return ONLY valid JSON with this exact shape:
{
  "positioning": "string - the real positioning of this role beyond its title",
  "core_responsibilities": ["string"],
  "must_have": ["string"],
  "nice_to_have": ["string"],
  "ai_focus_points": ["string - AI-industry specific evaluation points"],
  "implicit_requirements": ["string"],
  "interview_focus": ["string"],
  "competency_weights": [{"name":"string","weight":number}]
}
JD:
"""${task.jd_text}"""`;
}

function resumeAnalystPrompt(task: any, lang: string) {
  return `You are an AI-industry resume analyst. Analyze the candidate resume against the target JD. Do NOT vaguely praise. Judge strictly based on resume evidence. Point out which projects are most worth deep-diving and what the interviewer is likely to probe.
${langNote(lang)}
Return ONLY valid JSON with this exact shape:
{
  "selling_points": ["string"],
  "matched_experience": ["string"],
  "gaps": ["string"],
  "risks": ["string"],
  "probe_points": ["string - projects/claims the interviewer will dig into"],
  "evidence_to_prepare": ["string - data/proof the candidate should prepare"]
}
JD:
"""${task.jd_text}"""
Resume:
"""${task.resume_text}"""`;
}

function matchScorerPrompt(task: any, lang: string) {
  return `You are an AI-industry JD-resume match evaluator. Compare the JD and resume, produce a match score and structured assessment.
${langNote(lang)}
Return ONLY valid JSON with this exact shape:
{
  "match_score": number (0-100),
  "strong_matches": ["string"],
  "weak_matches": ["string"],
  "risk_points": ["string"],
  "preparation_advice": ["string"],
  "interview_plan": [{"stage":"string","minutes":number,"focus":"string"}]
}
Total interview duration: ${task.duration} minutes.
JD:
"""${task.jd_text}"""
Resume:
"""${task.resume_text}"""`;
}

function interviewerPrompt(
  task: any,
  analysis: any,
  history: any[],
  isStress: boolean,
  questionCount: number,
  maxQuestions: number,
  lang: string,
) {
  const transcript = history
    .map(
      (m) =>
        `${m.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`,
    )
    .join("\n");
  return `You are an AI-industry mock interviewer for the role: ${DIRECTION_LABELS[task.job_direction] ?? task.job_direction} (${task.interview_type} interview). ${isStress ? "Use a STRESS interview style: be demanding, challenge weak answers firmly." : "Use a normal professional style."}
Conduct the interview based on the JD, resume and match report. Ask ONE question at a time. After the candidate answers, decide whether to follow up: if the answer is too vague, probe for specific details, data, evaluation methods and the candidate's real contribution; if the answer is strong, raise difficulty. Questions MUST be tailored to this JD, not generic. If the candidate is stuck, you may give one light hint inside the question.
This is question ${questionCount + 1} of about ${maxQuestions}. ${questionCount + 1 >= maxQuestions ? "This should be the FINAL question, then set done=true after they answer." : ""}
${langNote(lang)}
Return ONLY valid JSON:
{
  "question": "string - your next single question or follow-up",
  "stage": "string - current interview stage name",
  "question_type": "string - e.g. background, project_deepdive, competency_probe, case, wrapup",
  "jd_competency": "string - which JD competency this question targets",
  "done": boolean
}
JD:
"""${task.jd_text}"""
Resume:
"""${task.resume_text}"""
Match report (JSON): ${JSON.stringify(analysis)}
Conversation so far:
${transcript || "(none yet — produce the opening question)"}`;
}

function coachPrompt(task: any, analysis: any, history: any[], lang: string) {
  const transcript = history
    .map(
      (m) =>
        `${m.role === "interviewer" ? "INTERVIEWER" : "CANDIDATE"}: ${m.content}`,
    )
    .join("\n");
  return `You are an AI-industry interview coach. Based on the full interview transcript, generate a debrief report. Feedback must be specific, evidence-based, and include directly usable optimized answers. Evaluate whether the candidate has the role's capabilities in an AI-industry context: AI product judgment, technical understanding, Eval awareness, cost awareness, delivery/landing ability, communication.
Role: ${DIRECTION_LABELS[task.job_direction] ?? task.job_direction}.
${langNote(lang)}
Return ONLY valid JSON with this exact shape:
{
  "summary": {"grade":"string e.g. B+","overview":"string"},
  "ability_scores": [{"name":"string","score":number (0-10)}],
  "strengths": ["string"],
  "weaknesses": ["string"],
  "risk_answers": ["string - high-risk answers that could hurt the candidate"],
  "question_feedback": [{"question":"string","problems":["string"],"direction":["string"]}],
  "optimized_answers": [{"question":"string","answer":"string - a stronger model answer"}],
  "practice_plan": ["string - next-step practice suggestions"]
}
JD:
"""${task.jd_text}"""
Match report: ${JSON.stringify(analysis)}
Full transcript:
${transcript}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, lang = "zh-CN" } = body;

    // ----- ANALYZE: run JD + resume + match, store report -----
    if (action === "analyze") {
      const { taskId } = body;
      const { data: task, error: te } = await supabase
        .from("interview_tasks")
        .select("*")
        .eq("id", taskId)
        .single();
      if (te || !task) throw new Error("task not found");

      const [jdRaw, resumeRaw, matchRaw] = await Promise.all([
        runAgent(jdAnalystPrompt(task, lang)),
        runAgent(resumeAnalystPrompt(task, lang)),
        runAgent(matchScorerPrompt(task, lang)),
      ]);

      const jd = extractJson(jdRaw);
      const resume = extractJson(resumeRaw);
      const match = extractJson(matchRaw);

      const { data: report, error: re } = await supabase
        .from("analysis_reports")
        .insert({
          task_id: taskId,
          user_id: user.id,
          jd_analysis: jd,
          resume_analysis: resume,
          match_score: match.match_score ?? null,
          strong_matches: match.strong_matches ?? [],
          weak_matches: match.weak_matches ?? [],
          risk_points: match.risk_points ?? [],
          interview_plan: {
            advice: match.preparation_advice ?? [],
            plan: match.interview_plan ?? [],
          },
        })
        .select()
        .single();
      if (re) throw re;

      await supabase
        .from("interview_tasks")
        .update({ status: "analyzed", updated_at: new Date().toISOString() })
        .eq("id", taskId);

      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ----- INTERVIEW NEXT: get next interviewer question -----
    if (action === "interview_next") {
      const { sessionId, answer } = body;
      const { data: session, error: se } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (se || !session) throw new Error("session not found");

      const { data: task } = await supabase
        .from("interview_tasks")
        .select("*")
        .eq("id", session.task_id)
        .single();
      const { data: analysis } = await supabase
        .from("analysis_reports")
        .select("*")
        .eq("task_id", session.task_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // persist candidate answer if present
      if (answer && answer.trim()) {
        await supabase.from("interview_messages").insert({
          session_id: sessionId,
          user_id: user.id,
          role: "candidate",
          content: answer,
        });
      }

      const { data: history } = await supabase
        .from("interview_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      // free plan caps at 5 questions
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle();
      const isPaid = profile?.plan === "paid";
      const maxQuestions = isPaid ? (task.duration >= 30 ? 8 : 5) : 5;

      const askedCount = (history ?? []).filter(
        (m) => m.role === "interviewer",
      ).length;

      if (askedCount >= maxQuestions) {
        await supabase
          .from("interview_sessions")
          .update({ status: "awaiting_feedback" })
          .eq("id", sessionId);
        return new Response(
          JSON.stringify({ done: true, capped: !isPaid }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const raw = await runAgent(
        interviewerPrompt(
          task,
          analysis ?? {},
          history ?? [],
          task.difficulty === "stress",
          askedCount,
          maxQuestions,
          lang,
        ),
      );
      const q = extractJson(raw);

      const { data: msg } = await supabase
        .from("interview_messages")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          role: "interviewer",
          content: q.question,
          question_type: q.question_type ?? null,
          jd_competency: q.jd_competency ?? null,
        })
        .select()
        .single();

      await supabase
        .from("interview_sessions")
        .update({
          current_stage: q.stage ?? null,
          question_count: askedCount + 1,
        })
        .eq("id", sessionId);

      return new Response(
        JSON.stringify({ message: msg, stage: q.stage, done: !!q.done }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ----- FINISH: coach generates feedback report -----
    if (action === "finish") {
      const { sessionId } = body;
      const { data: session } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (!session) throw new Error("session not found");

      // return existing report if already generated
      const { data: existing } = await supabase
        .from("feedback_reports")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ report: existing }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: task } = await supabase
        .from("interview_tasks")
        .select("*")
        .eq("id", session.task_id)
        .single();
      const { data: analysis } = await supabase
        .from("analysis_reports")
        .select("*")
        .eq("task_id", session.task_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: history } = await supabase
        .from("interview_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      const raw = await runAgent(
        coachPrompt(task, analysis ?? {}, history ?? [], lang),
      );
      const fb = extractJson(raw);

      const { data: report, error: fe } = await supabase
        .from("feedback_reports")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          summary: fb.summary ?? {},
          ability_scores: fb.ability_scores ?? [],
          strengths: fb.strengths ?? [],
          weaknesses: fb.weaknesses ?? [],
          risk_answers: fb.risk_answers ?? [],
          question_feedback: fb.question_feedback ?? [],
          optimized_answers: fb.optimized_answers ?? [],
          practice_plan: fb.practice_plan ?? [],
        })
        .select()
        .single();
      if (fe) throw fe;

      await supabase
        .from("interview_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
          overall_score: fb.summary?.grade ?? null,
        })
        .eq("id", sessionId);

      return new Response(JSON.stringify({ report }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview-agent error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});