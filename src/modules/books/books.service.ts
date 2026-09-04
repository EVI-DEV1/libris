import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createBookSchema, listBooksSchema, updateBookSchema } from './books.schema';

const bookInclude = {
  category: { select: { id: true, name: true } },
  authors: { include: { author: { select: { id: true, name: true } } } },
  _count: { select: { copies: true } },
} satisfies Prisma.BookInclude;

type BookWithRelations = Prisma.BookGetPayload<{ include: typeof bookInclude }>;

/** Achata a tabela de juncao: o cliente da API quer `authors: [{id,name}]`. */
function present(book: BookWithRelations & { copies?: { status: string }[] }) {
  const { authors, _count, copies, ...rest } = book;
  return {
    ...rest,
    authors: authors.map((a) => a.author),
    totalCopies: _count.copies,
    ...(copies && { availableCopies: copies.filter((c) => c.status === 'AVAILABLE').length }),
  };
}

function orderByFrom(sort: z.infer<typeof listBooksSchema>['sort']): Prisma.BookOrderByWithRelationInput {
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return { [field]: desc ? 'desc' : 'asc' };
}

export const booksService = {
  async list(query: z.infer<typeof listBooksSchema>) {
    const { search, categoryId, authorId, available, sort, ...pagination } = query;

    const where: Prisma.BookWhereInput = {
      ...(categoryId && { categoryId }),
      ...(authorId && { authors: { some: { authorId } } }),
      ...(available && { copies: { some: { status: 'AVAILABLE' } } }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { isbn: { contains: search } },
          { publisher: { contains: search } },
          { authors: { some: { author: { name: { contains: search } } } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { ...bookInclude, copies: { select: { status: true } } },
        orderBy: orderByFrom(sort),
        ...toSkipTake(pagination),
      }),
      prisma.book.count({ where }),
    ]);

    return paginated(data.map(present), total, pagination);
  },

  async findById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        ...bookInclude,
        copies: { select: { id: true, code: true, status: true, shelf: true } },
      },
    });
    if (!book) throw AppError.notFound('Livro');
    return present(book);
  },

  async create(input: z.infer<typeof createBookSchema>) {
    const { authorIds, categoryId, ...data } = input;
    await assertAuthorsExist(authorIds);
    if (categoryId) await assertCategoryExists(categoryId);

    const book = await prisma.book.create({
      data: {
        ...data,
        ...(categoryId && { categoryId }),
        authors: { create: authorIds.map((authorId) => ({ authorId })) },
      },
      include: bookInclude,
    });
    return present(book);
  },

  async update(id: string, input: z.infer<typeof updateBookSchema>) {
    await this.findById(id);
    const { authorIds, categoryId, ...data } = input;
    if (authorIds) await assertAuthorsExist(authorIds);
    if (categoryId) await assertCategoryExists(categoryId);

    const book = await prisma.book.update({
      where: { id },
      data: {
        ...data,
        ...(categoryId !== undefined && { categoryId }),
        // Substituicao total do vinculo: PATCH de authorIds define a lista final.
        ...(authorIds && {
          authors: { deleteMany: {}, create: authorIds.map((authorId) => ({ authorId })) },
        }),
      },
      include: bookInclude,
    });
    return present(book);
  },

  async remove(id: string) {
    const emprestados = await prisma.copy.count({
      where: { bookId: id, status: { in: ['ON_LOAN', 'RESERVED'] } },
    });
    if (emprestados > 0) {
      throw AppError.conflict('Ha exemplares emprestados ou reservados deste livro');
    }
    await prisma.book.delete({ where: { id } });
  },
};

async function assertAuthorsExist(ids: string[]) {
  const found = await prisma.author.count({ where: { id: { in: ids } } });
  if (found !== new Set(ids).size) throw AppError.badRequest('Um ou mais autores nao existem');
}

async function assertCategoryExists(id: string) {
  const found = await prisma.category.findUnique({ where: { id }, select: { id: true } });
  if (!found) throw AppError.badRequest('Categoria informada nao existe');
}
