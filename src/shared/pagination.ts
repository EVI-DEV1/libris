import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function toSkipTake({ page, perPage }: Pagination) {
  return { skip: (page - 1) * perPage, take: perPage };
}

export function paginated<T>(data: T[], total: number, { page, perPage }: Pagination) {
  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
      hasNext: page * perPage < total,
    },
  };
}
