import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { listUsersSchema, updateUserSchema } from './users.schema';

const publicUser = { id: true, name: true, email: true, role: true, active: true, createdAt: true };

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
