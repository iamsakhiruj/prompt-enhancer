const $in = document.getElementById("in");
const $out = document.getElementById("out");
const $added = document.getElementById("added");

document.getElementById("enhance").addEventListener("click", () => {
  const { enhanced, added } = window.__PromptEnhancer.enhance($in.value);
  $out.value = enhanced;
  $added.textContent = added.length ? "Added: " + added.join(" · ") : enhanced ? "Cleaned up — prompt already had good structure" : "";
});

document.getElementById("copy").addEventListener("click", async (e) => {
  if (!$out.value) return;
  await navigator.clipboard.writeText($out.value);
  e.target.textContent = "Copied ✓";
  setTimeout(() => (e.target.textContent = "Copy result"), 1400);
});
