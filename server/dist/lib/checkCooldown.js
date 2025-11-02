"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canInvokeCheck = canInvokeCheck;
exports.resetCooldown = resetCooldown;
const cooldownMap = new Map();
const COOLDOWN_MS = 10 * 1000; // 10 seconds
function canInvokeCheck(userId) {
    const last = cooldownMap.get(userId) || 0;
    const now = Date.now();
    if (now - last < COOLDOWN_MS) {
        return { ok: false, waitMs: COOLDOWN_MS - (now - last) };
    }
    cooldownMap.set(userId, now);
    return { ok: true };
}
function resetCooldown(userId) {
    cooldownMap.delete(userId);
}
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of cooldownMap.entries()) {
        if (now - v > COOLDOWN_MS * 10)
            cooldownMap.delete(k);
    }
}, COOLDOWN_MS * 5).unref?.();
//# sourceMappingURL=checkCooldown.js.map