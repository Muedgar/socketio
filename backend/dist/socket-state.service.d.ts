import { Socket } from 'socket.io';
export declare class SocketStateService {
    private readonly userSockets;
    add(userId: string, socket: Socket): void;
    remove(userId: string, socketId: string): void;
    snapshot(): {
        userId: string;
        socketIds: string[];
    }[];
}
