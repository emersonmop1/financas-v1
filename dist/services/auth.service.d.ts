import { LoginDTO, RegisterDTO, AuthResponse } from '../types';
export declare class AuthService {
    register(data: RegisterDTO): Promise<AuthResponse>;
    login(data: LoginDTO): Promise<AuthResponse>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        createdAt: Date;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map