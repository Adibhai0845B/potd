// GFG content script: injects page-context script (external file) + DOM fallback (no inline scripts).

let alreadySent = false;

function getSlugFromUrl() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (!parts.length) return null;
  const idx = parts[0] === "problems" ? 1 : parts.length - 1;
  let slug = parts[idx] || null;
  if (slug && slug.toLowerCase() === "problems") slug = parts[idx + 1] || null;
  if (slug) slug = slug.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return slug || null;
}

function sendCompletionOnce() {
  if (alreadySent) return;
  const slug = getSlugFromUrl();
  if (!slug) return;
  alreadySent = true;
  chrome.runtime.sendMessage({
    type: "SUBMIT_COMPLETION",
    payload: { site: "gfg", problem: { title: "", slug } }
  });
}

// Inject external page-context script (allowed by CSP)
(function injectExternal() {
  const url = chrome.runtime.getURL("content/gfg_injected.js");
  const s = document.createElement("script");
  s.src = url;
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);
})();

// Listen for acceptance event from injected script
window.addEventListener("message", (ev) => {
  if (ev?.data?.type === "GFG_ACCEPTED") sendCompletionOnce();
}, false);

// DOM fallback
const KEYWORDS = ["Correct Answer", "All test cases passed", "All testcases passed", "Accepted"];
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
