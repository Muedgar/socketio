"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = void 0;
exports.signDemoToken = signDemoToken;
exports.verifySocketToken = verifySocketToken;
const jwt = require("jsonwebtoken");
exports.JWT_SECRET = 'socketio-foundations-secret';
function signDemoToken(userId, role = 'user') {
    return jwt.sign({ userId, role }, exports.JWT_SECRET, { expiresIn: '1h' });
}
function verifySocketToken(token) {
    if (!token) {
        throw new Error('Missing auth token');
    }
    const payload = jwt.verify(token, exports.JWT_SECRET);
    if (typeof payload !== 'object' || !payload.userId) {
        throw new Error('Invalid auth token payload');
    }
    return {
        userId: String(payload.userId),
        role: payload.role === 'admin' ? 'admin' : 'user',
    };
}
//# sourceMappingURL=auth.js.map