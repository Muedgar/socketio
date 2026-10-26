'use client'

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getDemoToken } from "../../../lib/auth";

export default function Home() {
    const chatBoxRef = useRef<HTMLDivElement>(null);

    // socket
    const [socket, setSocket] = useState<Socket | null>(null);
    const [status, setStatus] = useState('connecting');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<{from: string, to: string, message: string} []>([]);
    const [typingUser, setTypingUser] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const socketId = socket?.id ?? 'not connected';

    useEffect(() => {
    let liveSocket: Socket | undefined;
    let cancelled = false;

    async function connect() {
        try {
            const token = await getDemoToken('user1');
            if (cancelled) return;

            const client = io('http://localhost:3001', {
                auth: { token },
                reconnectionAttempts: 10,
            });

            liveSocket = client;

            client.on('connect', () => {
                setSocket(client);
                setStatus('connected');
            });

            client.on('disconnect', () => {
                setSocket(null);
                setStatus('disconnected');
            });

            client.on('connect_error', (err) => {
                setStatus('connection error');
                console.error(err);
            });
        } catch (err) {
            if (!cancelled) setStatus('connection error');
            console.error(err);
        }
    }

    void connect();

    return () => {
        cancelled = true;
        liveSocket?.disconnect();
    };
    }, []);

    useEffect(() => {
    if (!socket) return;

    const handleMessage = (payload: {
        from: string;
        to: string;
        message: string;
    }) => {
        setMessages((prev) => [...prev, payload]);
    };

    socket.on('sentExampleMessage', handleMessage);

    return () => {
        socket.off('sentExampleMessage', handleMessage);
    };
}, [socket]);

useEffect(() => {
    if (!socket) return;

    const handleIsTyping = (payload: {message: string}) => {
        setIsTyping(true);
        setTypingUser(payload.message);
    }

    socket.on("isTyping", handleIsTyping);

    return () => {
        socket.off('isTyping', handleIsTyping)
    }
}, [socket])

const handleSendMessage = () => {
    if (!socket?.connected) return;
    if (!message.trim()) return;

    socket.emit('sendExampleMessage', message.trim());

    setMessage('');
};

const handleTyping = () => {
    if (!socket?.connected) return;
    socket.emit('isTyping', `${socket.id}`);
}

const handleNotTyping = () => {
    // setTimeout(() => {

    // setIsTyping(false);
    // setTypingUser("");
    // }, 200);
}

    return (
        <div className="w-screen h-screen bg-amber-300 flex flex-col justify-center items-center">
            <p>Status: {status} {socket?.id}</p>
            <div ref={chatBoxRef} className="w-[80%] h-[90%] border flex flex-col relative">
                {/* messages */}
                <div className="absolute w-full h-[90%] bg-amber-200 overflow-scroll">
                    {messages.map((data, i) => (
                        <p className="w-full h-fit p-2 bg-amber-200" key={i}>{data.message}</p>
                    ))}
                    <p className="absolute bottom-0 w-full h-10 bg-slate-200">{isTyping ? `${typingUser} is typing ...` : ''}</p>
                </div>
                {/* text input */}
                <div className="w-full h-[10%] bg-slate-50 absolute bottom-0">
                    <textarea value={message} onKeyUp={() => handleNotTyping()} onKeyDown={() => handleTyping()} onChange={(e) => setMessage(e.target.value)} className="w-full h-full p-2 font-bold text-lg" />
                    <button onClick={handleSendMessage} className="absolute right-0 m-5">Send</button>
                </div>
            </div>
        </div>
    );
}