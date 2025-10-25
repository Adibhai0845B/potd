async function load() {
  const { API_BASE, allowedAppOrigins } = await new Promise((r) =>
    chrome.storage.local.get({ API_BASE: "http://localhost:4000", allowedAppOrigins: ["http://localhost:5173"] }, r)
  );
  document.getElementById("api").value = API_BASE;
  document.getElementById("token").value = (await new Promise((r) => chrome.storage.local.get({ apiToken: "" }, r))).apiToken || "";
  document.getElementById("origins").value = allowedAppOrigins.join(", ");
}
async function save() {
  const API_BASE = document.getElementById("api").value.trim();
  const apiToken = document.getElementById("token").value.trim();
  const originsRaw = document.getElementById("origins").value.trim();
  const allowedAppOrigins = originsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  await new Promise((r) => chrome.storage.local.set({ API_BASE, allowedAppOrigins, apiToken }, r));
  chrome.runtime.sendMessage({ type: "SET_CONFIG", patch: { API_BASE, allowedAppOrigins, apiToken } }, () => {});
  alert("Saved!");
}
document.getElementById('getToken').addEventListener('click', async () => {
  const API_BASE = document.getElementById('api').value.trim() || 'http://localhost:4000';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const resultEl = document.getElementById('tokenResult');
  resultEl.textContent = 'Requesting...';
  try {
    const res = await fetch(`${API_BASE}/auth/generate-token`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
    });
    const body = await res.json().catch(()=>({}));
    if (res.ok && body.token) {
      await new Promise((r)=> chrome.storage.local.set({ apiToken: body.token }, r));
      document.getElementById('token').value = body.token;
      resultEl.textContent = 'Token saved to extension options.';
    } else {
      resultEl.textContent = 'Failed: ' + (body.error || 'Unknown');
    }
  } catch (e) { resultEl.textContent = 'Network error'; }
});
document.getElementById("save").addEventListener("click", save);
load();
