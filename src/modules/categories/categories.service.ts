import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { AppError } from '../../shared/AppError';
import { paginated, toSkipTake } from '../../shared/pagination';
import type { createCategorySchema, listCategoriesSchema } from './categories.schema';

export const categoriesService = {
  async list(query: z.infer<typeof listCategoriesSchema>) {
    const { search, ...pagination } = query;
    const where = search ? { name: { contains: search } } : {};
    const [data, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        include: { _count: { select: { books: true } } },
        ...toSkipTake(pagination),
      }),
      prisma.category.count({ where }),
    ]);
    return paginated(data, total, pagination);
  },

  async findById(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw AppError.notFound('Categoria');
    return category;
  },

  create(data: z.infer<typeof createCategorySchema>) {
    return prisma.category.create({ data });
  },

  async update(id: string, data: z.infer<typeof createCategorySchema>) {
    await this.findById(id);
    return prisma.category.update({ where: { id }, data });
  },

  async remove(id: string) {
    const livros = await prisma.book.count({ where: { categoryId: id } });
    if (livros > 0) throw AppError.conflict(`Categoria possui ${livros} livro(s) vinculado(s)`);
    await prisma.category.delete({ where: { id } });
  },
};
