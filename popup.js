"use strict";

const $in      = document.getElementById("in");
const $out     = document.getElementById("out");
const $added   = document.getElementById("added");
const $enhance = document.getElementById("enhance");

// ---- Helpers -----------------------------------------------------------
function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

// ---- Enhance button ----------------------------------------------------
$enhance.addEventListener("click", async () => {
  const raw = $in.value.trim();
  if (!raw) return;

  $enhance.disabled = true;
  $enhance.textContent = "✦ Enhancing…";

  try {
    const s = await storageGet(["aiEnabled", "provider", "apiKey"]);
    const useAI = !!(s.aiEnabled && s.apiKey && s.provider);

    if (useAI) {
      const resp = await new Promise((resolve) =>
        chrome.runtime.sendMessage({ type: "enhance", text: raw }, resolve)
      );
      if (resp && resp.ok) {
        $out.value = resp.result;
        $added.textContent = "AI enhanced ✦";
      } else {
        throw new Error((resp && resp.error) || "AI unavailable");
      }
    } else {
      runRuleBased(raw);
    }
  } catch (_) {
    runRuleBased($in.value);
  } finally {
    $enhance.disabled = false;
    $enhance.textContent = "✦ Enhance";
  }
});

function runRuleBased(raw) {
  const { enhanced, added } = window.__PromptEnhancer.enhance(raw);
  $out.value = enhanced;
  $added.textContent = added.length
    ? "Added: " + added.join(" · ")
    : enhanced ? "Cleaned up — prompt already had good structure" : "";
}

document.getElementById("copy").addEventListener("click", async (e) => {
  if (!$out.value) return;
  await navigator.clipboard.writeText($out.value);
  e.target.textContent = "Copied ✓";
  setTimeout(() => (e.target.textContent = "Copy result"), 1400);
});

// ---- AI settings -------------------------------------------------------
const $provider    = document.getElementById("ai-provider");
const $key         = document.getElementById("ai-key");
const $enabled     = document.getElementById("ai-enabled");
const $status      = document.getElementById("ai-status");
const $geminiLink  = document.getElementById("gemini-link");
const $testBtn     = document.getElementById("test-key");

function showStatus(msg, ok) {
  $status.textContent = msg;
  $status.className = "ai-status " + (ok ? "ok" : "err");
  setTimeout(() => { $status.textContent = ""; $status.className = "ai-status"; }, 3500);
}

function updateGeminiLink() {
  $geminiLink.style.display = $provider.value === "gemini" ? "" : "none";
}

$provider.addEventListener("change", updateGeminiLink);

// Load saved settings on open
chrome.storage.local.get(["provider", "apiKey", "aiEnabled"], (s) => {
  if (s.provider) $provider.value = s.provider;
  if (s.apiKey)   $key.value = s.apiKey;
  // Default toggle to on when a key is already saved; off when no key yet
  $enabled.checked = (s.aiEnabled !== false) && !!s.apiKey;
  updateGeminiLink();
});

document.getElementById("save-ai").addEventListener("click", () => {
  const provider  = $provider.value;
  const apiKey    = $key.value.trim();
  const aiEnabled = $enabled.checked;
  chrome.storage.local.set({ provider, apiKey, aiEnabled }, () => {
    showStatus(apiKey ? "Settings saved." : "Cleared.", !!apiKey);
  });
});

$testBtn.addEventListener("click", () => {
  const provider = $provider.value;
  const apiKey   = $key.value.trim();
  if (!apiKey) { showStatus("Paste an API key first.", false); return; }

  $testBtn.disabled = true;
  $testBtn.textContent = "Testing…";
  $status.textContent = "";

  chrome.runtime.sendMessage({ type: "testKey", provider, apiKey }, (resp) => {
    $testBtn.disabled = false;
    $testBtn.textContent = "Test";
    if (resp && resp.ok) {
      showStatus("✓ Key works!", true);
    } else {
      showStatus("✗ " + ((resp && resp.error) || "No response"), false);
    }
  });
});
