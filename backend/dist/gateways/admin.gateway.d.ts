import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
export declare class AdminGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    server: Namespace;
    afterInit(server: Namespace): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    onAdminRoomMessage(payload: {
        room: string;
        message: string;
    }): void;
    onAdminDirectMessage(client: Socket, payload: {
        socketId: string;
        message: string;
    }): void;
}
