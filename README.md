# Prompt Enhancer

Free Chrome extension that turns rough prompts into structured, high-quality ones with one click. Runs 100% locally — no API keys, no servers, no data leaves the browser.

## What it does

A floating **✦ Enhance** button appears above the chat input on ChatGPT, Claude, Gemini, DeepSeek, Grok, Perplexity, and Copilot. Click it (or press **Alt+E**) and the extension:

1. Detects the task type (writing, coding, explaining, summarizing, analyzing, brainstorming, translating, planning)
2. Checks what the prompt is missing — role, context, output format, length guidance
3. Rebuilds it into a structured prompt, adding only what's absent
4. Shows a preview you can edit, then **Replace in chat** or **Copy**

The toolbar popup does the same for any text you paste, on any site.

## Install (developer mode)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Visit chatgpt.com or claude.ai — the ✦ Enhance button appears above the input

## Publish to the Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/devconsole ($5 one-time fee)
2. Zip this folder
3. Upload, fill in the listing (screenshots, description, privacy: "does not collect any data")
4. Review usually takes 1–3 days

## Files

- `manifest.json` — Manifest V3 config
- `enhancer.js` — rule-based enhancement engine (pure logic, no DOM)
- `content.js` — finds the chat input, injects button + preview panel
- `content.css` — injected UI styles
- `popup.html` / `popup.js` — toolbar popup for any-site use
- `icons/` — 16/48/128 px icons

## Roadmap ideas

- Optional "bring your own API key" mode for AI-powered rewriting
- Per-site enhancement styles (e.g. Midjourney/image-prompt mode)
- History of enhanced prompts
- User-editable templates
