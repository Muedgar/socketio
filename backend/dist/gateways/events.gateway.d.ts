import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketUser } from '../auth';
import { SocketStateService } from '../socket-state.service';
type AuthedSocket = Socket & {
    data: {
        user: SocketUser;
    };
};
export declare class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly socketState;
    server: Server;
    constructor(socketState: SocketStateService);
    afterInit(server: Server): void;
    handleConnection(client: AuthedSocket): void;
    handleDisconnect(client: AuthedSocket): void;
    onHello(payload: unknown, client: AuthedSocket): void;
    onAckMessage(payload: unknown): {
        status: string;
    };
    onJoinRoom(client: AuthedSocket, room: string): Promise<void>;
    onLeaveRoom(client: AuthedSocket, room: string): Promise<void>;
    onDirectMessage(client: AuthedSocket, payload: {
        socketId: string;
        message: string;
    }): void;
    onBroadcastExceptSender(client: AuthedSocket, message: string): void;
    onSendObject(client: AuthedSocket): void;
}
export {};
