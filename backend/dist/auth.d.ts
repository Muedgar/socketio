export type SocketUser = {
    userId: string;
    role: 'user' | 'admin';
};
export declare const JWT_SECRET = "socketio-foundations-secret";
export declare function signDemoToken(userId: string, role?: SocketUser['role']): string;
export declare function verifySocketToken(token?: string): SocketUser;
