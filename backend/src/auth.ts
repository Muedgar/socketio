import * as jwt from 'jsonwebtoken';

export type SocketUser = {
  userId: string;
  role: 'user' | 'admin';
};

export const JWT_SECRET = 'socketio-foundations-secret';

export function signDemoToken(userId: string, role: SocketUser['role'] = 'user') {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifySocketToken(token?: string): SocketUser {
  if (!token) {
    throw new Error('Missing auth token');
  }

  const payload = jwt.verify(token, JWT_SECRET);

  if (typeof payload !== 'object' || !payload.userId) {
    throw new Error('Invalid auth token payload');
  }

  return {
    userId: String(payload.userId),
    role: payload.role === 'admin' ? 'admin' : 'user',
  };
}
