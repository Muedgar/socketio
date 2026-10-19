"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const auth_1 = require("../auth");
let AdminGateway = class AdminGateway {
    server;
    afterInit(server) {
        server.use((socket, next) => {
            try {
                const user = (0, auth_1.verifySocketToken)(socket.handshake.auth.token);
                if (user.role !== 'admin') {
                    throw new Error('Admin namespace requires an admin token');
                }
                socket.data.user = user;
                next();
            }
            catch (error) {
                next(error instanceof Error ? error : new Error('Unauthorized'));
            }
        });
    }
    handleConnection(client) {
        console.log(`admin connected ${client.id}`);
        client.emit('admin_connected', { socketId: client.id });
    }
    handleDisconnect(client) {
        console.log(`admin disconnected ${client.id}`);
    }
    onAdminRoomMessage(payload) {
        this.server.server.of('/').to(payload.room).emit('room_message', {
            room: payload.room,
            from: 'admin',
            message: payload.message,
        });
    }
    onAdminDirectMessage(client, payload) {
        this.server.server.of('/').to(payload.socketId).emit('direct_message', {
            from: `admin:${client.id}`,
            message: payload.message,
        });
    }
};
exports.AdminGateway = AdminGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Namespace)
], AdminGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin_room_message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminGateway.prototype, "onAdminRoomMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('admin_direct_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AdminGateway.prototype, "onAdminDirectMessage", null);
exports.AdminGateway = AdminGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/admin',
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3002'],
            credentials: true,
        },
    })
], AdminGateway);
//# sourceMappingURL=admin.gateway.js.map