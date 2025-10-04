let awardedThisLoad = false;
const KEYWORDS = ["Correct Answer", "All test cases passed", "Accepted"];

function slugFromUrl() {
  const parts = location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || null;
}
function tryDetect(node) {
  if (awardedThisLoad) return;
  const text = (node?.innerText || node?.textContent || "").trim();
  if (!text) return;
  if (KEYWORDS.some(k => text.includes(k))) {
    const slug = slugFromUrl();
    if (!slug) return;
    awardedThisLoad = true;
    chrome.runtime.sendMessage({ type: "SUBMIT_COMPLETION", payload: { site: "gfg", problem: { title: "", slug } } });
  }
}
new MutationObserver(muts => {
  for (const m of muts) {
    if (m.type === "childList") m.addedNodes.forEach(tryDetect);
    else if (m.type === "attributes") tryDetect(m.target);
  }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
