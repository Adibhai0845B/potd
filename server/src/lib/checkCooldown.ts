const cooldownMap = new Map<string, number>();
const COOLDOWN_MS = 60 * 1000; // 60 seconds

export function canInvokeCheck(userId: string): { ok: boolean; waitMs?: number } {
  const last = cooldownMap.get(userId) || 0;
  const now = Date.now();
  if (now - last < COOLDOWN_MS) {
    return { ok: false, waitMs: COOLDOWN_MS - (now - last) };
  }
  // allow and set timestamp
  cooldownMap.set(userId, now);
  return { ok: true };
}

// For tests or admin usage
export function resetCooldown(userId: string) {
  cooldownMap.delete(userId);
}

// Periodic cleanup to avoid unbounded growth in long-running processes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cooldownMap.entries()) {
    if (now - v > COOLDOWN_MS * 10) cooldownMap.delete(k);
  }
}, COOLDOWN_MS * 5).unref?.();
