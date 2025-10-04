async function load() {
  const { API_BASE, allowedAppOrigins } = await new Promise((r) =>
    chrome.storage.local.get({ API_BASE: "http://localhost:4000", allowedAppOrigins: ["http://localhost:5173"] }, r)
  );
  document.getElementById("api").value = API_BASE;
  document.getElementById("origins").value = allowedAppOrigins.join(", ");
}
async function save() {
  const API_BASE = document.getElementById("api").value.trim();
  const originsRaw = document.getElementById("origins").value.trim();
  const allowedAppOrigins = originsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  await new Promise((r) => chrome.storage.local.set({ API_BASE, allowedAppOrigins }, r));
  chrome.runtime.sendMessage({ type: "SET_CONFIG", patch: { API_BASE, allowedAppOrigins } }, () => {});
  alert("Saved!");
}
document.getElementById("save").addEventListener("click", save);
load();
