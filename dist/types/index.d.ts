import { Request } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
}
export interface JWTPayload {
    userId: string;
}
export interface LoginDTO {
    email: string;
    password: string;
}
export interface RegisterDTO {
    email: string;
    password: string;
    name: string;
}
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}
//# sourceMappingURL=index.d.ts.map