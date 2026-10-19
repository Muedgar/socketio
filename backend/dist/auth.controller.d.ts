export declare class AuthController {
    getDemoToken(userId: string, role?: 'user' | 'admin'): {
        userId: string;
        role: string;
        token: string;
    };
}
