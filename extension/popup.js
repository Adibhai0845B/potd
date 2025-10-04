function set(id, text, cls) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = "pill " + (cls || "");
}
document.getElementById("openOptions").addEventListener("click", () => chrome.runtime.openOptionsPage());
document.getElementById("openApp").addEventListener("click", async () => {
  const { allowedAppOrigins } = await new Promise((r) => chrome.storage.local.get({ allowedAppOrigins: ["http://localhost:5173"] }, r));
  chrome.tabs.create({ url: allowedAppOrigins[0] });
});
chrome.runtime.sendMessage({ type: "GET_STATUS" }, (resp) => {
  if (!resp?.ok) { set("api", "n/a", "warn"); return; }
  set("api", resp.API_BASE, "ok");
});