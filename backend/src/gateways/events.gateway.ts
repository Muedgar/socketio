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
import { Server, Socket } from 'socket.io';
import { SocketUser, verifySocketToken } from '../auth';
import { SocketStateService } from '../socket-state.service';

type AuthedSocket = Socket & {
  data: {
    user: SocketUser;
  };
};

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly socketState: SocketStateService) {}

afterInit(server: Server) {
    server.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token as string | undefined;
            const user = verifySocketToken(token);

            socket.data.user = user;

            next();
        } catch (error) {
            next(error instanceof Error ? error : new Error('Unauthorized'));
        }
    });
}


handleConnection(client: AuthedSocket) {
    this.socketState.add(client.data.user.userId, client);

    console.log(`connected ${client.id}`);

    this.server.emit(
        'connected_users',
        this.socketState.snapshot()
    );
}

  handleDisconnect(client: AuthedSocket) {
    this.socketState.remove(client.data.user.userId, client.id);
    console.log(`disconnected ${client.id}`);
    this.server.emit('connected_users', this.socketState.snapshot());
  }

  @SubscribeMessage('hello_server')
  onHello(@MessageBody() payload: unknown, @ConnectedSocket() client: AuthedSocket) {
    console.log('hello_server', { from: client.id, payload });
  }

  @SubscribeMessage('ack_message')
  onAckMessage(@MessageBody() payload: unknown) {
    console.log('ack_message', payload);
    return { status: 'OK' };
  }

  @SubscribeMessage('join_room')
  async onJoinRoom(@ConnectedSocket() client: AuthedSocket, @MessageBody() room: string) {
    await client.join(room);
    client.emit('room_message', { room, message: `${client.data.user.userId} joined ${room}` });
  }

  @SubscribeMessage('leave_room')
  async onLeaveRoom(@ConnectedSocket() client: AuthedSocket, @MessageBody() room: string) {
    await client.leave(room);
    client.emit('room_message', { room, message: `${client.data.user.userId} left ${room}` });
  }

  @SubscribeMessage('direct_message')
  onDirectMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { socketId: string; message: string },
  ) {
    this.server.to(payload.socketId).emit('direct_message', {
      from: client.id,
      message: payload.message,
    });
  }

  @SubscribeMessage('broadcast_except_sender')
  onBroadcastExceptSender(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() message: string,
  ) {
    client.broadcast.emit('broadcast_message', {
      from: client.id,
      message,
    });
  }

  @SubscribeMessage('sendExampleMessage')
  onSendMessageExample1(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() message: string,
  ) {
    // {from: string, to: string, message: string}
    this.server.emit('sentExampleMessage', {
    from: client.id,
    to: 'all',
    message,
});
  }

  @SubscribeMessage('send_object')
  onSendObject(@ConnectedSocket() client: AuthedSocket) {
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
}
