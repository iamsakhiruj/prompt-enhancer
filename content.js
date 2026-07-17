/* Prompt Enhancer — content script: finds the chat input, injects the button + panel. */
(function () {
  "use strict";
  if (window.__peInjected) return;
  window.__peInjected = true;

  const SITES = [
    { host: /chatgpt\.com|chat\.openai\.com/, input: "#prompt-textarea, div[contenteditable='true']" },
    { host: /claude\.ai/, input: "div[contenteditable='true'].ProseMirror, div[contenteditable='true']" },
    { host: /gemini\.google\.com/, input: "div[contenteditable='true'], rich-textarea div[contenteditable='true']" },
    { host: /chat\.deepseek\.com/, input: "textarea, div[contenteditable='true']" },
    { host: /grok\.com/, input: "textarea, div[contenteditable='true']" },
    { host: /perplexity\.ai/, input: "textarea, div[contenteditable='true']" },
    { host: /copilot\.microsoft\.com/, input: "textarea, div[contenteditable='true']" }
  ];

  const site = SITES.find((s) => s.host.test(location.host)) || { input: "textarea, div[contenteditable='true']" };

  // ---- Input helpers ---------------------------------------------------
  function findInput() {
    const nodes = document.querySelectorAll(site.input);
    // Pick the visible one closest to the bottom of the viewport (the composer)
    let best = null, bestY = -1;
    nodes.forEach((n) => {
      const r = n.getBoundingClientRect();
      const visible = r.width > 80 && r.height > 10 && r.bottom > 0 && r.top < innerHeight;
      if (visible && r.top > bestY) { bestY = r.top; best = n; }
    });
    return best;
  }

  function readInput(el) {
    if (!el) return "";
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return el.value;
    return el.innerText.replace(/\u200b/g, "");
  }

  function writeInput(el, text) {
    if (!el) return;
    el.focus();
    if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") {
      const setter = Object.getOwnPropertyDescriptor(
        el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
        "value"
      ).set;
      setter.call(el, text);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    // contenteditable (ProseMirror etc.): select all, insert as plain text
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    // execCommand still works in Chrome and plays nicely with rich editors
    document.execCommand("insertText", false, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // ---- UI --------------------------------------------------------------
  const btn = document.createElement("button");
  btn.id = "pe-fab";
  btn.type = "button";
  btn.title = "Enhance prompt (Alt+E)";
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z" fill="currentColor"/>
    <path d="M19 14l.9 2.6L22.5 17.5l-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z" fill="currentColor" opacity="0.7"/>
  </svg><span>Enhance</span>`;
  document.documentElement.appendChild(btn);

  const panel = document.createElement("div");
  panel.id = "pe-panel";
  panel.hidden = true;
  panel.innerHTML = `
    <div class="pe-head">
      <span class="pe-title">Enhanced prompt</span>
      <span class="pe-added" id="pe-added"></span>
      <button type="button" class="pe-x" id="pe-close" title="Close">×</button>
    </div>
    <textarea id="pe-text" spellcheck="false"></textarea>
    <div class="pe-actions">
      <button type="button" id="pe-copy" class="pe-ghost">Copy</button>
      <button type="button" id="pe-replace" class="pe-primary">Replace in chat</button>
    </div>`;
  document.documentElement.appendChild(panel);

  const $ = (id) => panel.querySelector(id);
  let currentInput = null;

  function positionUI() {
    const el = findInput();
    if (!el) { btn.style.display = "none"; return; }
    currentInput = el;
    btn.style.display = "flex";
    const r = el.getBoundingClientRect();
    btn.style.left = Math.max(8, r.right - btn.offsetWidth) + "px";
    btn.style.top = Math.max(8, r.top - btn.offsetHeight - 8) + "px";
  }

  function openPanel() {
    const raw = readInput(currentInput || findInput());
    if (!raw.trim()) { flash(btn, "Type a prompt first"); return; }
    const { enhanced, added } = window.__PromptEnhancer.enhance(raw);
    $("#pe-text").value = enhanced;
    $("#pe-added").textContent = added.length ? "added: " + added.join(" · ") : "";
    panel.hidden = false;
    positionPanel();
  }

  function positionPanel() {
    const r = btn.getBoundingClientRect();
    const w = Math.min(560, innerWidth - 24);
    panel.style.width = w + "px";
    panel.style.left = Math.max(12, Math.min(r.right - w, innerWidth - w - 12)) + "px";
    const h = panel.offsetHeight || 320;
    panel.style.top = Math.max(12, r.top - h - 10) + "px";
  }

  function flash(el, msg) {
    const t = el.querySelector("span");
    if (!t) return;
    const old = t.textContent;
    t.textContent = msg;
    setTimeout(() => (t.textContent = old), 1400);
  }

  btn.addEventListener("click", openPanel);
  $("#pe-close").addEventListener("click", () => (panel.hidden = true));
  $("#pe-copy").addEventListener("click", async () => {
    await navigator.clipboard.writeText($("#pe-text").value);
    $("#pe-copy").textContent = "Copied ✓";
    setTimeout(() => ($("#pe-copy").textContent = "Copy"), 1400);
  });
  $("#pe-replace").addEventListener("click", () => {
    writeInput(currentInput || findInput(), $("#pe-text").value);
    panel.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.altKey && e.code === "KeyE") { e.preventDefault(); openPanel(); }
    if (e.key === "Escape" && !panel.hidden) panel.hidden = true;
  });

  // Keep the button anchored as SPAs re-render
  const reposition = () => requestAnimationFrame(positionUI);
  new MutationObserver(reposition).observe(document.body, { childList: true, subtree: true });
  addEventListener("resize", reposition, { passive: true });
  addEventListener("scroll", reposition, { passive: true, capture: true });
  setInterval(positionUI, 1200);
  positionUI();
})();
