'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getDemoToken } from '../../lib/auth';

export default function AdminPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('connecting');
  const [room, setRoom] = useState('room1');
  const [roomMessage, setRoomMessage] = useState('admin-only room1 message');
  const [socketId, setSocketId] = useState('');
  const [directMessage, setDirectMessage] = useState('admin direct message');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useMemo(
    () => (message: string, data?: unknown) => {
      setLogs((current) => [`${message}${data ? ` ${JSON.stringify(data)}` : ''}`, ...current].slice(0, 20));
    },
    [],
  );

  useEffect(() => {
    let adminSocket: Socket | undefined;

    async function connectAdmin() {
      try {
        const token = await getDemoToken('admin1', 'admin');

        adminSocket = io('http://localhost:3001/admin', {
          auth: { token },
        });

        adminSocket.on('connect', () => {
          setStatus('connected');
          addLog('admin namespace connected', { socketId: adminSocket?.id });
        });

        adminSocket.on('connect_error', (error) => {
          setStatus(`connection error: ${error.message}`);
          addLog('connection error', { message: error.message });
        });

        adminSocket.on('admin_connected', (payload) => addLog('server says admin connected', payload));
        setSocket(adminSocket);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'failed to connect');
      }
    }

    void connectAdmin();

    return () => {
      adminSocket?.disconnect();
    };
  }, [addLog]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>Admin Namespace</h1>
          <p>Connected only through Socket.IO namespace /admin</p>
        </div>
        <Link className="navlink" href="/">
          User
        </Link>
      </header>

      <section className="status-strip">
        <div>
          <span>Status</span>
          <strong>{status}</strong>
        </div>
        <div>
          <span>Namespace</span>
          <strong>/admin</strong>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <h2>Room Message</h2>
          <label>
            Room
            <input value={room} onChange={(event) => setRoom(event.target.value)} />
          </label>
          <label>
            Message
            <input value={roomMessage} onChange={(event) => setRoomMessage(event.target.value)} />
          </label>
          <button onClick={() => socket?.emit('admin_room_message', { room, message: roomMessage })} disabled={!socket}>
            Send to room
          </button>
        </div>

        <div className="panel">
          <h2>Direct Socket</h2>
          <label>
            Target socket ID
            <input value={socketId} onChange={(event) => setSocketId(event.target.value)} placeholder="Paste user socket ID" />
          </label>
          <label>
            Message
            <input value={directMessage} onChange={(event) => setDirectMessage(event.target.value)} />
          </label>
          <button onClick={() => socket?.emit('admin_direct_message', { socketId, message: directMessage })} disabled={!socket || !socketId}>
            Send to socket
          </button>
        </div>

        <div className="panel wide">
          <h2>Admin Log</h2>
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
