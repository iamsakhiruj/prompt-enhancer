"use strict";

const META_PROMPT =
  "You are a prompt engineering expert. Rewrite the user's rough prompt into a clear, well-structured prompt. Fix typos and grammar. Infer the true intent. Add: an appropriate expert role, the cleaned task, relevant context questions in [brackets] only if critical info is missing, output format guidance, and quality constraints. Preserve the user's language (if they wrote in Malay, enhance in Malay). Return ONLY the rewritten prompt, no explanations, no markdown code fences.";

async function callGemini(apiKey, text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: META_PROMPT }] },
      contents: [{ role: "user", parts: [{ text }] }]
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function callOpenAI(apiKey, text) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: META_PROMPT },
        { role: "user", content: text }
      ]
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function callAnthropic(apiKey, text) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: META_PROMPT,
      messages: [{ role: "user", content: text }]
    }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || "";
}

async function callAI(provider, apiKey, text) {
  if (provider === "gemini")    return callGemini(apiKey, text);
  if (provider === "openai")    return callOpenAI(apiKey, text);
  if (provider === "anthropic") return callAnthropic(apiKey, text);
  throw new Error("Unknown provider: " + provider);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "enhance") {
    chrome.storage.local.get(["provider", "apiKey", "aiEnabled"], async (s) => {
      if (!s.aiEnabled || !s.apiKey || !s.provider) {
        sendResponse({ ok: false, error: "AI mode not configured" });
        return;
      }
      try {
        const result = await callAI(s.provider, s.apiKey, msg.text);
        sendResponse({ ok: true, result });
      } catch (e) {
        sendResponse({ ok: false, error: e.message || String(e) });
      }
    });
    return true;
  }

  if (msg.type === "testKey") {
    const { provider, apiKey } = msg;
    callAI(provider, apiKey, "Reply with the single word OK.")
      .then(() => sendResponse({ ok: true }))
      .catch((e) => sendResponse({ ok: false, error: e.message || String(e) }));
    return true;
  }
});
