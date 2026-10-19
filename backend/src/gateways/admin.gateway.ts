import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { verifySocketToken } from '../auth';

@WebSocketGateway({
  namespace: '/admin',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
})
export class AdminGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Namespace;

  afterInit(server: Namespace) {
    server.use((socket, next) => {
      try {
        const user = verifySocketToken(socket.handshake.auth.token as string | undefined);

        if (user.role !== 'admin') {
          throw new Error('Admin namespace requires an admin token');
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(error instanceof Error ? error : new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: Socket) {
    console.log(`admin connected ${client.id}`);
    client.emit('admin_connected', { socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`admin disconnected ${client.id}`);
  }

  @SubscribeMessage('admin_room_message')
  onAdminRoomMessage(@MessageBody() payload: { room: string; message: string }) {
    this.server.server.of('/').to(payload.room).emit('room_message', {
      room: payload.room,
      from: 'admin',
      message: payload.message,
    });
  }

  @SubscribeMessage('admin_direct_message')
  onAdminDirectMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: { socketId: string; message: string }) {
    this.server.server.of('/').to(payload.socketId).emit('direct_message', {
      from: `admin:${client.id}`,
      message: payload.message,
    });
  }
}
