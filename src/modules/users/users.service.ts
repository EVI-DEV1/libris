import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createStaffSchema, listUsersSchema, updateUserSchema } from './users.schema';

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  active: true,
  mustChangePassword: true,
  createdAt: true,
};

export const usersService = {
  async list(query: z.infer<typeof listUsersSchema>) {
    const { search, role, active, ...pagination } = query;
    const where = {
      ...(role && { role }),
      ...(active !== undefined && { active }),
      ...(search && {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: publicUser,
        orderBy: { name: 'asc' },
        ...toSkipTake(pagination),
      }),
      prisma.user.count({ where }),
    ]);

    return paginated(data, total, pagination);
  },

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { ...publicUser, _count: { select: { loans: true, reservations: true } } },
    });
    if (!user) throw AppError.notFound('Usuario');
    return user;
  },

  /** Cria conta de equipe com a senha padrao e troca obrigatoria. */
  async createStaff(input: z.infer<typeof createStaffSchema>) {
    const existe = await prisma.user.findUnique({ where: { email: input.email } });
    if (existe) throw AppError.conflict("Ja existe um usuario com esse e-mail");

    return prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: input.role,
        passwordHash: await bcrypt.hash(env.SENHA_PADRAO, 10),
        mustChangePassword: true,
      },
      select: publicUser,
    });
  },

  /**
   * Devolve a conta para a senha padrao. E o caminho de "esqueci a senha"
   * nesta versao: sem servico de e-mail, quem restabelece acesso e a direcao,
   * presencialmente — e a troca obrigatoria volta a valer.
   */
  async resetPassword(id: string) {
    const alvo = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!alvo) throw AppError.notFound("Usuario");

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(env.SENHA_PADRAO, 10),
        mustChangePassword: true,
      },
    });
  },

  async update(id: string, data: z.infer<typeof updateUserSchema>) {
    await this.findById(id);
    return prisma.user.update({ where: { id }, data, select: publicUser });
  },

  async remove(id: string) {
    const activeLoans = await prisma.loan.count({ where: { userId: id, status: { not: 'RETURNED' } } });
    if (activeLoans > 0) {
      throw AppError.conflict(
        `Usuario tem ${activeLoans} emprestimo(s) em aberto. Registre a devolucao antes de desativar.`,
      );
    }
    // Desativacao logica: o historico de emprestimo e registro contabil da
    // biblioteca e nao pode sumir junto com o cadastro.
    await prisma.user.update({ where: { id }, data: { active: false } });
  },
};
