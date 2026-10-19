"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketStateService = void 0;
const common_1 = require("@nestjs/common");
let SocketStateService = class SocketStateService {
    userSockets = new Map();
    add(userId, socket) {
        const sockets = this.userSockets.get(userId) ?? new Set();
        if (sockets.size >= 3) {
            throw new Error(`Connection limit reached for user ${userId}`);
        }
        sockets.add(socket.id);
        this.userSockets.set(userId, sockets);
    }
    remove(userId, socketId) {
        const sockets = this.userSockets.get(userId);
        if (!sockets) {
            return;
        }
        sockets.delete(socketId);
        if (sockets.size === 0) {
            this.userSockets.delete(userId);
        }
    }
    snapshot() {
        return Array.from(this.userSockets.entries()).map(([userId, socketIds]) => ({
            userId,
            socketIds: Array.from(socketIds),
        }));
    }
};
exports.SocketStateService = SocketStateService;
exports.SocketStateService = SocketStateService = __decorate([
    (0, common_1.Injectable)()
], SocketStateService);
//# sourceMappingURL=socket-state.service.js.map