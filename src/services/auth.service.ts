import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { LoginDTO, RegisterDTO, AuthResponse } from '../types';

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    // Gerar token
    const token = jwt.sign({ userId: user.id }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = jwt.sign({ userId: user.id }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }
}
