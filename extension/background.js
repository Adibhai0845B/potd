const DEFAULTS = { API_BASE: "http://localhost:4000", allowedAppOrigins: ["http://localhost:5173"] };

function getAllConfig() {
  return new Promise((resolve) => chrome.storage.local.get({ API_BASE: DEFAULTS.API_BASE, allowedAppOrigins: DEFAULTS.allowedAppOrigins }, resolve));
}
function notify(title, message) {
  if (!chrome.notifications) return;
  chrome.notifications.create({ type: "basic", iconUrl: "icons/icon128.png", title, message });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    const { API_BASE } = await getAllConfig();

    if (msg?.type === "SUBMIT_COMPLETION") {
      try {
        const res = await fetch(`${API_BASE}/submit`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(msg.payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) { notify("POTD marked!", `Awarded: ${data.coinsAdded ?? 0} | Streak: ${data.streak ?? "?"}`); }
        else { notify("POTD not marked", data?.error || "Server rejected"); }
        sendResponse({ ok: res.ok, data });
      } catch (e) {
        notify("Network error", String(e));
        sendResponse({ ok: false, error: String(e) });
      }
      return;
    }

    if (msg?.type === "GET_STATUS") { sendResponse({ ok: true, API_BASE }); return; }
    if (msg?.type === "SET_CONFIG") { await new Promise((r) => chrome.storage.local.set(msg.patch || {}, r)); sendResponse({ ok: true }); return; }
  })();
  return true;
});
