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
exports.EventsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const auth_1 = require("../auth");
const socket_state_service_1 = require("../socket-state.service");
let EventsGateway = class EventsGateway {
    socketState;
    server;
    constructor(socketState) {
        this.socketState = socketState;
    }
    afterInit(server) {
        server.use((socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const user = (0, auth_1.verifySocketToken)(token);
                this.socketState.add(user.userId, socket);
                socket.data.user = user;
                next();
            }
            catch (error) {
                next(error instanceof Error ? error : new Error('Unauthorized'));
            }
        });
        setInterval(() => {
            server.emit('ping', { at: new Date().toISOString(), message: 'ping from server' });
        }, 5000);
    }
    handleConnection(client) {
        console.log(`connected ${client.id} as ${client.data.user.userId}`);
        client.emit('server_object', {
            title: 'Welcome object',
            user: client.data.user,
            socketId: client.id,
            examples: ['array item 1', 'array item 2'],
        });
        this.server.emit('connected_users', this.socketState.snapshot());
    }
    handleDisconnect(client) {
        this.socketState.remove(client.data.user.userId, client.id);
        console.log(`disconnected ${client.id}`);
        this.server.emit('connected_users', this.socketState.snapshot());
    }
    onHello(payload, client) {
        console.log('hello_server', { from: client.id, payload });
    }
    onAckMessage(payload) {
        console.log('ack_message', payload);
        return { status: 'OK' };
    }
    async onJoinRoom(client, room) {
        await client.join(room);
        client.emit('room_message', { room, message: `${client.data.user.userId} joined ${room}` });
    }
    async onLeaveRoom(client, room) {
        await client.leave(room);
        client.emit('room_message', { room, message: `${client.data.user.userId} left ${room}` });
    }
    onDirectMessage(client, payload) {
        this.server.to(payload.socketId).emit('direct_message', {
            from: client.id,
            message: payload.message,
        });
    }
    onBroadcastExceptSender(client, message) {
        client.broadcast.emit('broadcast_message', {
            from: client.id,
            message,
        });
    }
    onSendObject(client) {
        client.emit('server_object', {
            title: 'Object and array payload',
            sentAt: new Date().toISOString(),
            nested: {
                socketId: client.id,
                rooms: Array.from(client.rooms),
            },
            list: [
                { id: 1, label: 'first object in an array' },
                { id: 2, label: 'second object in an array' },
            ],
        });
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('hello_server'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onHello", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ack_message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onAckMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "onJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "onLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('direct_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onDirectMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('broadcast_except_sender'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onBroadcastExceptSender", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_object'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "onSendObject", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3002'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [socket_state_service_1.SocketStateService])
], EventsGateway);
//# sourceMappingURL=events.gateway.js.map