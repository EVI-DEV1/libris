import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createAuthorSchema, listAuthorsSchema, updateAuthorSchema } from './authors.schema';

export const authorsService = {
  async list(query: z.infer<typeof listAuthorsSchema>) {
    const { search, ...pagination } = query;
    const where = search ? { name: { contains: search } } : {};

    const [data, total] = await Promise.all([
      prisma.author.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { books: true } } },
        ...toSkipTake(pagination),
      }),
      prisma.author.count({ where }),
    ]);
    return paginated(data, total, pagination);
  },

  async findById(id: string) {
    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: { include: { book: { select: { id: true, title: true, isbn: true } } } } },
    });
    if (!author) throw AppError.notFound('Autor');
    return { ...author, books: author.books.map((b) => b.book) };
  },

  create(data: z.infer<typeof createAuthorSchema>) {
    return prisma.author.create({ data });
  },

  async update(id: string, data: z.infer<typeof updateAuthorSchema>) {
    await this.findById(id);
    return prisma.author.update({ where: { id }, data });
  },

  async remove(id: string) {
    const vinculos = await prisma.bookAuthor.count({ where: { authorId: id } });
    if (vinculos > 0) throw AppError.conflict('Autor possui livros vinculados no acervo');
    await prisma.author.delete({ where: { id } });
  },
};
