import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createCopySchema, listCopiesSchema, updateCopySchema } from './copies.schema';

const withBook = { book: { select: { id: true, title: true, isbn: true } } };

export const copiesService = {
  async list(query: z.infer<typeof listCopiesSchema>) {
    const { bookId, status, code, ...pagination } = query;
    const where = {
      ...(bookId && { bookId }),
      ...(status && { status }),
      ...(code && { code: { contains: code } }),
    };

    const [data, total] = await Promise.all([
      prisma.copy.findMany({
        where,
        include: withBook,
        orderBy: { code: 'asc' },
        ...toSkipTake(pagination),
      }),
      prisma.copy.count({ where }),
    ]);
    return paginated(data, total, pagination);
  },

  async findById(id: string) {
    const copy = await prisma.copy.findUnique({
      where: { id },
      include: {
        ...withBook,
        loans: {
          where: { status: { not: 'RETURNED' } },
          select: { id: true, dueAt: true, user: { select: { id: true, name: true } } },
        },
      },
    });
    if (!copy) throw AppError.notFound('Exemplar');
    return copy;
  },

  async create(data: z.infer<typeof createCopySchema>) {
    const book = await prisma.book.findUnique({ where: { id: data.bookId }, select: { id: true } });
    if (!book) throw AppError.badRequest('Livro informado nao existe');
    return prisma.copy.create({ data, include: withBook });
  },

  async update(id: string, data: z.infer<typeof updateCopySchema>) {
    const copy = await this.findById(id);
    if (copy.status === 'ON_LOAN') {
      throw AppError.conflict('Exemplar esta emprestado. Registre a devolucao antes de alterar.');
    }
    return prisma.copy.update({ where: { id }, data, include: withBook });
  },

  async remove(id: string) {
    const copy = await this.findById(id);
    if (copy.status === 'ON_LOAN' || copy.status === 'RESERVED') {
      throw AppError.conflict('Exemplar em uso nao pode ser removido');
    }
    await prisma.copy.delete({ where: { id } });
  },
};
