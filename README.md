# Socket.IO Foundations

Two-app playground for Socket.IO Level 1 foundations:

- `backend`: NestJS Gateway on `http://localhost:3001`
- `frontend`: Next.js app on `http://localhost:3000`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## What is implemented

1. Next.js connects to a NestJS Gateway and prints `connected`.
2. Client emits `hello_server`; Gateway logs it.
3. Server emits `ping` every 5 seconds.
4. Client sends `ack_message`; server returns `{ status: "OK" }`.
5. Client logs disconnects and reconnects.
6. `/admin` namespace is available at `http://localhost:3000/admin`.
7. User can join `room1`.
8. User can leave `room1`.
9. Admin can send a message only to `room1`.
10. Admin or user can send a direct message to a socket ID.
11. User can broadcast to everyone except sender.
12. Socket middleware verifies JWTs from `handshake.auth.token`.
13. Missing or invalid JWTs reject the socket with `connect_error`.
14. Backend limits each user to 3 active sockets.
15. Server emits object and array payloads that render in Next.js.
