"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionRequired = sessionRequired;
function sessionRequired(req, res, next) {
    console.log('Session check:', req.session);
    // @ts-ignore
    if (!req.session?.userId)
        return res.status(401).json({ error: "Unauthorized" });
    next();
}
//# sourceMappingURL=sessionAuth.js.map