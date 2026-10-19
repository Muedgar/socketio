import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class SocketStateService {
  private readonly userSockets = new Map<string, Set<string>>();

  add(userId: string, socket: Socket) {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();

    if (sockets.size >= 3) {
      throw new Error(`Connection limit reached for user ${userId}`);
    }

    sockets.add(socket.id);
    this.userSockets.set(userId, sockets);
  }

  remove(userId: string, socketId: string) {
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
}
