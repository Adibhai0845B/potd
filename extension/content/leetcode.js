let awardedThisLoad = false;
const KEYWORDS = ["Accepted", "accepted"];

function slugFromUrl() {
  const m = location.pathname.match(/^\/problems\/([^\/]+)\//);
  return m ? m[1] : null;
}
function tryDetect(node) {
  if (awardedThisLoad) return;
  const text = (node?.innerText || node?.textContent || "").trim();
  if (!text) return;
  if (KEYWORDS.some(k => text.includes(k))) {
    const slug = slugFromUrl();
    if (!slug) return;
    awardedThisLoad = true;
    chrome.runtime.sendMessage({ type: "SUBMIT_COMPLETION", payload: { site: "leetcode", problem: { title: "", slug } } });
  }
}
new MutationObserver(muts => {
  for (const m of muts) {
    if (m.type === "childList") m.addedNodes.forEach(tryDetect);
    else if (m.type === "attributes") tryDetect(m.target);
  }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
