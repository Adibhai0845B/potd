const BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://potdback.onrender.com');

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) }
  });
  // In production (Vercel), API calls should go to the backend URL
  // In development, use the proxy or direct localhost
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const msg = typeof body === "string" ? body : (body as any).error || "API error";
    throw new Error(msg);
  }
  return body as T;
}
