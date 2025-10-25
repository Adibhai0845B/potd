// LeetCode content script: inject external page-context hook + DOM fallback.
let alreadySent = false;
function getSlugFromUrl() {
  const m = location.pathname.match(/^\/problems\/([^/]+)\//);
  return m?m[1]:null;
}
function sendCompletionOnce() {
  if (alreadySent) return;
  const slug = getSlugFromUrl();
  if (!slug) return;
  alreadySent = true;
  chrome.runtime.sendMessage({
    type: "SUBMIT_COMPLETION",
    payload: { site: "leetcode", problem: { title: "", slug } }
  });
}
// inject page-context script
(function injectExternal() {
  const url = chrome.runtime.getURL("content/leetcode_injected.js");
  const s = document.createElement("script");
  s.src = url;
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
})();

// listen for page event
window.addEventListener("message", (ev) => {
  if (ev?.data?.type === "LC_ACCEPTED") sendCompletionOnce();
}, false);

// DOM fallback
const KEYWORDS = ["Accepted", "accepted"];
function tryDomDetect(node) {
  if (alreadySent) return;
  const text = (node?.innerText || node?.textContent || "").trim();
  if (!text) return;
  if (KEYWORDS.some((k) => text.includes(k))) sendCompletionOnce();
}

new MutationObserver((muts) => {
  for (const m of muts) {
    if (m.type === "childList") m.addedNodes.forEach(tryDomDetect);
    else if (m.type === "attributes") tryDomDetect(m.target);
  }
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true });

tryDomDetect(document.body);
