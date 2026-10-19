'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getDemoToken } from '../lib/auth';

type ConnectedUser = {
  userId: string;
  socketIds: string[];
};

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('connecting');
  const [logs, setLogs] = useState<string[]>([]);
  const [room, setRoom] = useState('room1');
  const [directSocketId, setDirectSocketId] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [objectPayload, setObjectPayload] = useState<unknown>(null);

  const socketId = socket?.id ?? 'not connected';

  const addLog = useMemo(
    () => (message: string, data?: unknown) => {
      const rendered = data ? `${message} ${JSON.stringify(data)}` : message;
      setLogs((current) => [rendered, ...current].slice(0, 30));
    },
    [],
  );

  useEffect(() => {
    let liveSocket: Socket | undefined;

    async function connect() {
      try {
        const token = await getDemoToken('user1');

        liveSocket = io('http://localhost:3001', {
          auth: { token },
          reconnectionAttempts: 10,
        });

        liveSocket.on('connect', () => {
          setStatus('connected');
          addLog('connected', { socketId: liveSocket?.id });
        });

        liveSocket.io.on('reconnect', (attempt) => {
          addLog('reconnected', { attempt, socketId: liveSocket?.id });
        });

        liveSocket.on('disconnect', (reason) => {
          setStatus(`disconnected: ${reason}`);
          addLog('disconnected', { reason });
        });

        liveSocket.on('connect_error', (error) => {
          setStatus(`connection error: ${error.message}`);
          addLog('connection error', { message: error.message });
        });

        liveSocket.on('ping', (payload) => addLog('server ping', payload));
        liveSocket.on('room_message', (payload) => addLog('room message', payload));
        liveSocket.on('direct_message', (payload) => addLog('direct message', payload));
        liveSocket.on('broadcast_message', (payload) => addLog('broadcast except sender', payload));
        liveSocket.on('connected_users', setConnectedUsers);
        liveSocket.on('server_object', setObjectPayload);

        setSocket(liveSocket);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'failed to connect');
      }
    }

    void connect();

    return () => {
      liveSocket?.disconnect();
    };
  }, [addLog]);

  function emitHello() {
    socket?.emit('hello_server', { message: 'hello from Next.js', at: new Date().toISOString() });
    addLog('sent hello_server');
  }

  function sendAckMessage() {
    socket?.emit('ack_message', { message: 'please ack this' }, (reply: { status: string }) => {
      addLog('ack reply', reply);
    });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Socket.IO Foundations</h1>
          <p>NestJS Gateway + Next.js client playground</p>
        </div>
        <Link className="navlink" href="/admin">
          Admin
        </Link>
      </header>

      <section className="status-strip">
        <div>
          <span>Status</span>
          <strong>{status}</strong>
        </div>
        <div>
          <span>Socket ID</span>
          <strong>{socketId}</strong>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Events</h2>
          <div className="actions">
            <button onClick={emitHello} disabled={!socket}>Emit hello_server</button>
            <button onClick={sendAckMessage} disabled={!socket}>Send ACK message</button>
            <button onClick={() => socket?.emit('send_object')} disabled={!socket}>Request object payload</button>
            <button onClick={() => socket?.emit('broadcast_except_sender', 'hello everyone except me')} disabled={!socket}>
              Broadcast except sender
            </button>
          </div>
        </div>

        <div className="panel">
          <h2>Rooms</h2>
          <label>
            Room
            <input value={room} onChange={(event) => setRoom(event.target.value)} />
          </label>
          <div className="actions">
            <button onClick={() => socket?.emit('join_room', room)} disabled={!socket}>Join room</button>
            <button onClick={() => socket?.emit('leave_room', room)} disabled={!socket}>Leave room</button>
          </div>
        </div>

        <div className="panel">
          <h2>Direct Message</h2>
          <label>
            Target socket ID
            <input value={directSocketId} onChange={(event) => setDirectSocketId(event.target.value)} placeholder="Paste a socket ID" />
          </label>
          <button onClick={() => socket?.emit('direct_message', { socketId: directSocketId, message: 'direct hello from user1' })} disabled={!socket || !directSocketId}>
            Send to socket ID
          </button>
        </div>

        <div className="panel">
          <h2>Connected Users</h2>
          <pre>{JSON.stringify(connectedUsers, null, 2)}</pre>
        </div>

        <div className="panel wide">
          <h2>Object Payload</h2>
          <pre>{JSON.stringify(objectPayload, null, 2)}</pre>
        </div>

        <div className="panel wide">
          <h2>Event Log</h2>
          <div className="log">
            {logs.map((line, index) => (
              <code key={`${line}-${index}`}>{line}</code>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
