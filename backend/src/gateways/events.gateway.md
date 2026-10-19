This is a **NestJS WebSocket Gateway** using **Socket.IO**.

Think of it like a real-time “chat/control center” between your backend and frontend.

## Big idea

HTTP is like:

> frontend asks → backend answers → connection ends

WebSocket is like:

> frontend connects once → backend and frontend can keep talking instantly

So this gateway lets your app do things like:

* show connected users
* send live messages
* join/leave rooms
* broadcast updates
* send direct messages
* push live server events every few seconds

## 1. Imports

```ts
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
```

These are NestJS WebSocket decorators.

They help Nest know:

```ts
@SubscribeMessage('hello_server')
```

means:

> when frontend emits `"hello_server"`, run this function.

## 2. Socket.IO types

```ts
import { Server, Socket } from 'socket.io';
```

* `Server` = the whole Socket.IO server
* `Socket` = one connected user/device/browser tab

So:

```ts
server.emit(...)
```

means send to everyone.

```ts
client.emit(...)
```

means send only to this one connected socket.

## 3. Custom authenticated socket

```ts
type AuthedSocket = Socket & {
  data: {
    user: SocketUser;
  };
};
```

Normal Socket.IO sockets have `socket.data`.

This code says:

> after login, every socket will have `socket.data.user`.

So later you can do:

```ts
client.data.user.userId
```

## 4. Gateway setup

```ts
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
})
```

This creates the WebSocket server.

Only these frontend URLs are allowed to connect:

```ts
http://localhost:3000
http://localhost:3002
```

Useful during local development.

## 5. Injecting socket state service

```ts
constructor(private readonly socketState: SocketStateService) {}
```

This service probably stores connected users and their socket IDs.

For example:

```ts
user-1 -> socketA
user-2 -> socketB
```

That makes it possible to show “online users”.

## 6. Authentication happens here

```ts
afterInit(server: Server) {
  server.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;
      const user = verifySocketToken(token);

      this.socketState.add(user.userId, socket);
      socket.data.user = user;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Unauthorized'));
    }
  });
}
```

This is middleware.

Before a socket connects fully, the backend checks the token.

Frontend probably connects like:

```ts
io("http://localhost:3001", {
  auth: {
    token: "jwt-token-here"
  }
});
```

Then backend does:

```ts
verifySocketToken(token)
```

If token is valid:

```ts
socket.data.user = user;
next();
```

If token is invalid:

```ts
next(new Error('Unauthorized'));
```

So unauthorized users cannot connect.

## 7. Server sends ping every 5 seconds

```ts
setInterval(() => {
  server.emit('ping', {
    at: new Date().toISOString(),
    message: 'ping from server',
  });
}, 5000);
```

Every 5 seconds, backend sends this to all connected clients:

```ts
ping
```

Example frontend listener:

```ts
socket.on("ping", data => {
  console.log(data);
});
```

This is useful to prove the connection is alive.

## 8. When a user connects

```ts
handleConnection(client: AuthedSocket) {
  console.log(`connected ${client.id} as ${client.data.user.userId}`);
```

When a frontend connects, this logs:

```ts
connected socket123 as user456
```

Then it sends a welcome object only to that client:

```ts
client.emit('server_object', {
  title: 'Welcome object',
  user: client.data.user,
  socketId: client.id,
  examples: ['array item 1', 'array item 2'],
});
```

Then it tells everyone the new connected users list:

```ts
this.server.emit('connected_users', this.socketState.snapshot());
```

## 9. When a user disconnects

```ts
handleDisconnect(client: AuthedSocket) {
  this.socketState.remove(client.data.user.userId, client.id);
```

When browser closes, refreshes, or loses connection:

* remove socket from online users
* log disconnection
* send updated connected users list to everyone

## 10. Listen for `"hello_server"`

```ts
@SubscribeMessage('hello_server')
onHello(@MessageBody() payload: unknown, @ConnectedSocket() client: AuthedSocket) {
  console.log('hello_server', { from: client.id, payload });
}
```

Frontend emits:

```ts
socket.emit("hello_server", { text: "hi backend" });
```

Backend receives it and logs it.

It does not return anything.

## 11. Listen for `"ack_message"`

```ts
@SubscribeMessage('ack_message')
onAckMessage(@MessageBody() payload: unknown) {
  console.log('ack_message', payload);
  return { status: 'OK' };
}
```

This one returns a response.

Frontend can use Socket.IO acknowledgement:

```ts
socket.emit("ack_message", { text: "save this" }, response => {
  console.log(response); // { status: "OK" }
});
```

So this is like:

> client sends message, server confirms it received it.

## 12. Join a room

```ts
@SubscribeMessage('join_room')
async onJoinRoom(@ConnectedSocket() client: AuthedSocket, @MessageBody() room: string) {
  await client.join(room);
  client.emit('room_message', {
    room,
    message: `${client.data.user.userId} joined ${room}`,
  });
}
```

Rooms are like groups/channels.

Example:

```ts
socket.emit("join_room", "project-123");
```

Now that socket is inside room `project-123`.

This is useful for:

* project chat
* task updates
* live collaboration
* document rooms
* Gantt updates per project

## 13. Leave a room

```ts
@SubscribeMessage('leave_room')
async onLeaveRoom(@ConnectedSocket() client: AuthedSocket, @MessageBody() room: string) {
  await client.leave(room);
  client.emit('room_message', {
    room,
    message: `${client.data.user.userId} left ${room}`,
  });
}
```

This removes the socket from that room.

## 14. Direct message to one socket

```ts
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
```

This sends a message to one specific socket.

Frontend sends:

```ts
socket.emit("direct_message", {
  socketId: "targetSocketId",
  message: "Hello only you"
});
```

Backend sends to that socket only:

```ts
direct_message
```

Important: this uses `socketId`, not `userId`.

## 15. Broadcast to everyone except sender

```ts
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
```

This means:

> send this message to everyone except the person who sent it.

Example use:

* “Edgar is typing…”
* “Task was moved”
* “User joined page”
* “Cursor position changed”

The sender does not need to receive it because they already know what they did.

## 16. Send object payload

```ts
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
```

When frontend emits:

```ts
socket.emit("send_object");
```

Backend replies with a complex object.

This shows that WebSockets can send:

* strings
* objects
* arrays
* nested data
* dates
* lists

## Simple mental model

This gateway is saying:

```ts
When user connects:
  check token
  save socket
  send welcome data
  tell everyone online list changed

When user disconnects:
  remove socket
  tell everyone online list changed

When frontend sends specific events:
  run specific backend functions
```

## In real product terms

For your project management/Gantt app, this same pattern can support:

```ts
join_room("project-123")
```

Then when one user moves a task:

```ts
task_moved
```

Backend can broadcast to everyone in that project room:

```ts
this.server.to("project-123").emit("task_updated", updatedTask)
```

So everyone sees the Gantt chart update live.
