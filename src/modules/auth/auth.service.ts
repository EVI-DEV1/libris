import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../shared/AppError';
import type { LoginInput, RegisterInput } from './auth.schema';

const publicUser = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export const authService = {
  async register(input: RegisterInput) {
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) throw AppError.conflict('Ja existe um usuario com esse e-mail');

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 10),
      },
      select: publicUser,
    });

    return { user, token: signToken(user) };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    // Mensagem unica para e-mail inexistente e senha errada: nao entregamos
    // ao atacante a informacao de quais e-mails existem na base.
    if (!user) throw AppError.unauthorized('E-mail ou senha incorretos');
    if (!user.active) throw AppError.forbidden('Usuario inativo. Procure a biblioteca.');

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw AppError.unauthorized('E-mail ou senha incorretos');

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: signToken(user),
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
    if (!user) throw AppError.notFound('Usuario');
    return user;
  },
};
