const BASE = import.meta.env.DEV?'/api':'https://potdback.onrender.com';
export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res=await fetch(`${BASE}${path}`, {
    credentials:"include",
    ...opts,
    headers:{"Content-Type":"application/json",...(opts.headers||{})}
  });
 const ct=res.headers.get("content-type") || "";
  const body=ct.includes("application/json") ? await res.json().catch(() => ({})) : await res.text();
  if(!res.ok) {
   const msg = typeof body === "string" ? body : (body as any).error || "API error";
  throw new Error(msg);
  }
return body as T;
}