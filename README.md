# Prompt Enhancer

Free Chrome extension that turns rough prompts into structured, high-quality ones with one click. Works in two modes:

- **Rule mode** — instant, fully local, no API key needed
- **AI mode** — send to Google Gemini, OpenAI, or Anthropic for deeper rewriting (bring your own key)

## What it does

A floating **✦ Enhance** button appears above the chat input on ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, and Copilot. Click it (or press **Alt+E**) and the extension:

1. Detects the task type (writing, coding, explaining, summarizing, analyzing, brainstorming, translating, planning)
2. Checks what the prompt is missing — role, context, output format, length guidance
3. Rebuilds it into a structured prompt, adding only what's absent
4. Shows a preview labelled **AI enhanced** or **Rule enhanced** that you can edit, then **Replace in chat** or **Copy**

The toolbar popup does the same for any text you paste, on any site.

## AI mode (optional)

1. Click the extension icon → open the **⚙ AI mode** panel
2. Choose a provider — Google Gemini is recommended (free key, no credit card)
3. Get a free Gemini key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
4. Paste your API key, click **Test** to verify it works, then **Save settings**
5. Make sure **"Use AI enhancement when available"** is checked

When AI mode is on and you click Enhance, the panel shows **✦ Enhancing…** while the AI rewrites your prompt. If the AI call fails for any reason (bad key, rate limit, timeout, offline) the extension silently falls back to rule mode and shows a small notice. Hover the notice to see the specific error.

### Privacy

Your API key is stored locally in your browser (`chrome.storage.local`) and is **sent only to your chosen AI provider's official API endpoint** — no proxy, no third-party server, nothing else. The rule-based mode makes zero network requests.

## Install (developer mode)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Visit chatgpt.com or claude.ai — the ✦ Enhance button appears above the input

## Manually testing AI mode

1. Load the extension unpacked (see above)
2. **Rule mode (no key):** open any supported site, type a short prompt, click **✦ Enhance**. The panel opens instantly labelled **Rule enhanced** with no key configured.
3. **AI mode:** click the extension icon → ⚙ AI mode → select Gemini → paste key → click **Test** (should show ✓ Key works!) → **Save settings**. Now click **✦ Enhance** on any supported site. The panel should briefly show **✦ Enhancing…** then switch to **AI enhanced**.
4. **Fallback:** temporarily paste a bad key → Save → click Enhance. The panel should show **Rule enhanced** with a yellow notice "AI unavailable — used quick mode". Hover the notice to see the error reason.

## Publish to the Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/devconsole ($5 one-time fee)
2. Zip this folder
3. Upload, fill in the listing (screenshots, description, privacy: "API key stored locally; only sent to user-chosen AI provider")
4. Review usually takes 1–3 days

## Files

- `manifest.json` — Manifest V3 config
- `background.js` — service worker: handles AI provider API calls on behalf of the content script
- `enhancer.js` — rule-based enhancement engine (pure logic, no DOM)
- `content.js` — finds the chat input, injects button + preview panel
- `content.css` — injected UI styles
- `popup.html` / `popup.js` — toolbar popup for any-site use + AI settings
- `icons/` — 16/48/128 px icons
