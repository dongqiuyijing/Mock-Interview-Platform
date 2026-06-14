const AGENT_BASE =
  "https://api.enter.pro/code/api/v1/agents/cf516df3-5a89-41a1-9a58-d1796ce1a7ad";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const result: Record<string, unknown> = {};
  const apiKey = Deno.env.get("AGENT_API_KEY");
  result.keyConfigured = !!apiKey;
  result.keyPreview = apiKey ? `${apiKey.slice(0, 6)}...(${apiKey.length} chars)` : null;

  if (!apiKey) {
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Step 1: create a thread
  try {
    const tr = await fetch(`${AGENT_BASE}/threads`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    result.threadStatus = tr.status;
    const threadText = await tr.text();
    result.threadBody = threadText.slice(0, 500);

    if (!tr.ok) {
      return new Response(JSON.stringify(result, null, 2), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let threadJson: any = {};
    try { threadJson = JSON.parse(threadText); } catch (_) {}
    const threadId = threadJson.thread_id ?? threadJson.threadId ?? threadJson.id;
    result.threadId = threadId;

    // Step 2: run a tiny prompt
    const runBody = {
      threadId,
      runId: crypto.randomUUID(),
      messages: [{ id: crypto.randomUUID(), role: "user", content: "Reply with exactly the word: PONG" }],
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
    result.runStatus = rr.status;

    if (!rr.ok || !rr.body) {
      result.runBody = (await rr.text()).slice(0, 500);
      return new Response(JSON.stringify(result, null, 2), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reader = rr.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    const eventTypes = new Set<string>();

    const handle = (raw: string) => {
      const t = raw.trim();
      if (!t || t === "[DONE]") return;
      let evt: any;
      try { evt = JSON.parse(t); } catch { return; }
      const type = (evt.type ?? evt.event ?? "").toString();
      if (type) eventTypes.add(type);
      if (typeof evt.delta === "string") text += evt.delta;
      else if (evt.delta && typeof evt.delta.content === "string") text += evt.delta.content;
      else if (type.toUpperCase().includes("TEXT_MESSAGE") && typeof evt.content === "string") text += evt.content;
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
        else if (l.startsWith("{")) handle(l);
      }
    }
    result.eventTypes = [...eventTypes];
    result.agentReply = text.trim().slice(0, 500);
    result.success = !!text.trim();
  } catch (e) {
    result.error = (e as Error).message;
  }

  return new Response(JSON.stringify(result, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
