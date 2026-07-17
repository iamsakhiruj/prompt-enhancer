/* Prompt Enhancer — rule-based engine. Runs 100% locally, no network calls. */
(function () {
  "use strict";

  // ---- Task detection -------------------------------------------------
  const TASKS = [
    {
      id: "code",
      test: /\b(code|coding|function|script|debug|fix (this|my)? ?(bug|error)|refactor|program|python|javascript|typescript|java|c\+\+|sql|api|regex|html|css|react|component)\b/i,
      role: "an expert software engineer who writes clean, well-documented, production-quality code",
      format: [
        "Provide the complete code in a single block",
        "Add brief comments explaining non-obvious parts",
        "After the code, explain key decisions in 2-3 sentences",
        "Mention any edge cases or limitations"
      ]
    },
    {
      id: "write",
      test: /\b(write|draft|compose|essay|article|blog|post|email|letter|caption|copy|headline|story|poem|speech|bio|description)\b/i,
      role: "a skilled professional writer who adapts tone and style to the audience",
      format: [
        "Match the tone and length specified below",
        "Use clear structure with a strong opening",
        "Avoid filler phrases and clichés"
      ]
    },
    {
      id: "explain",
      test: /\b(explain|what is|what are|how does|how do|why (is|do|does)|teach|understand|eli5|difference between|meaning of)\b/i,
      role: "a patient expert teacher who explains complex topics clearly",
      format: [
        "Start with a one-sentence plain-language summary",
        "Then explain step by step, building from basics",
        "Use a concrete example or analogy",
        "End with the most common misconception about this topic"
      ]
    },
    {
      id: "summarize",
      test: /\b(summarize|summarise|summary|tl;?dr|key points|condense|shorten|main ideas)\b/i,
      role: "an expert analyst who distills information without losing critical nuance",
      format: [
        "Lead with the single most important takeaway",
        "Then list the key points in order of importance",
        "Keep the total under the length limit specified",
        "Preserve any critical numbers, names, or caveats"
      ]
    },
    {
      id: "analyze",
      test: /\b(analyze|analyse|analysis|evaluate|compare|review|assess|pros and cons|critique|feedback on|strengths and weaknesses)\b/i,
      role: "a rigorous analyst who gives balanced, evidence-based assessments",
      format: [
        "State your overall assessment first",
        "Support each point with specific reasoning",
        "Cover both strengths and weaknesses",
        "End with a clear recommendation"
      ]
    },
    {
      id: "brainstorm",
      test: /\b(brainstorm|ideas? for|suggest|come up with|creative|name for|options for|alternatives|ways to)\b/i,
      role: "a creative strategist who generates diverse, practical ideas",
      format: [
        "Give 8-10 distinct ideas, not variations of the same one",
        "Range from safe/conventional to bold/unexpected",
        "One line of reasoning per idea",
        "Mark your top 2 picks and say why"
      ]
    },
    {
      id: "translate",
      test: /\b(translate|translation|in (spanish|french|german|chinese|japanese|korean|malay|arabic|hindi|portuguese|italian))\b/i,
      role: "a professional translator who preserves meaning, tone, and cultural nuance",
      format: [
        "Provide the translation first",
        "Note any phrases that don't translate directly and how you handled them"
      ]
    },
    {
      id: "plan",
      test: /\b(plan|roadmap|schedule|strategy|steps to|how to (start|build|launch|create)|checklist|itinerary)\b/i,
      role: "an experienced planner who creates realistic, actionable plans",
      format: [
        "Break the plan into clear phases or steps",
        "For each step: what to do, why it matters, and roughly how long it takes",
        "Flag the most common failure point and how to avoid it"
      ]
    }
  ];

  const GENERIC = {
    id: "general",
    role: "a knowledgeable expert assistant who gives thorough, accurate, well-organized answers",
    format: [
      "Structure your answer clearly",
      "Be specific and concrete rather than generic",
      "If anything is ambiguous, state your assumption and proceed"
    ]
  };

  // ---- Detectors for what the prompt already contains ------------------
  const HAS = {
    role: (t) => /\b(you are|act as|pretend (to be|you)|as an? |imagine you)/i.test(t),
    format: (t) => /\b(format|bullet|list|table|json|markdown|paragraph|steps|numbered|outline|in the form of)\b/i.test(t),
    length: (t) => /\b(\d+\s*(words?|sentences?|paragraphs?|pages?|items?|lines?)|short|brief|concise|detailed|long|comprehensive|one[- ]liner)\b/i.test(t),
    audience: (t) => /\b(for (a |an |my )?(beginner|expert|child|kid|student|team|boss|client|customer|manager|ceo|developer|audience)|explain.*to (a|an|my)\b|5[- ]year[- ]old|layman|non[- ]technical)/i.test(t),
    tone: (t) => /\b(formal|informal|casual|professional|friendly|funny|serious|persuasive|enthusiastic|academic|conversational|polite|tone)\b/i.test(t),
    examples: (t) => /\b(example|e\.g\.|for instance|such as|like this|sample)\b/i.test(t),
    context: (t) => t.split(/\s+/).length > 25
  };

  const VAGUE_FIXES = [
    [/\bmake it (good|better|nice)\b/gi, "improve clarity, specificity, and impact"],
    [/\bsome stuff\b/gi, "the relevant details"],
    [/\bthing(s)?\b/gi, "item$1"],
    [/\betc\.?\b/gi, "and similar items (state your assumptions about what else to include)"]
  ];

  function detectTask(text) {
    for (const t of TASKS) if (t.test.test(text)) return t;
    return GENERIC;
  }

  function cleanRaw(text) {
    let out = text.trim().replace(/\s+/g, " ");
    for (const [re, rep] of VAGUE_FIXES) out = out.replace(re, rep);
    // Capitalize first letter, ensure terminal punctuation
    out = out.charAt(0).toUpperCase() + out.slice(1);
    if (!/[.!?]$/.test(out)) out += ".";
    return out;
  }

  /**
   * enhance(raw) -> { enhanced: string, added: string[], task: string }
   */
  function enhance(raw) {
    const text = raw.trim();
    if (!text) return { enhanced: "", added: [], task: "none" };

    const task = detectTask(text);
    const added = [];
    const parts = [];

    // 1. Role
    if (!HAS.role(text)) {
      parts.push(`You are ${task.role}.`);
      added.push("role");
    }

    // 2. Task (cleaned original)
    parts.push(`# Task\n${cleanRaw(text)}`);

    // 3. Context nudge
    if (!HAS.context(text)) {
      parts.push(
        `# Context\n[Add any relevant background here — who this is for, what you've already tried, or constraints. Delete this section if not needed.]`
      );
      added.push("context prompt");
    }

    // 4. Output format
    if (!HAS.format(text)) {
      parts.push(`# Output format\n${task.format.map((f) => "- " + f).join("\n")}`);
      added.push("output format");
    }

    // 5. Quality bar
    const quality = [];
    if (!HAS.length(text)) {
      quality.push("Keep the response focused — depth over breadth.");
      added.push("length guidance");
    }
    quality.push("If any part of the task is ambiguous, state your assumption briefly and continue rather than asking.");
    parts.push(`# Quality bar\n${quality.map((q) => "- " + q).join("\n")}`);
    if (!added.includes("quality bar")) added.push("quality bar");

    return { enhanced: parts.join("\n\n"), added, task: task.id };
  }

  // Expose
  window.__PromptEnhancer = { enhance };
})();
