import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

/** ISBN-10 ou ISBN-13, aceitando hifens que sao removidos na normalizacao. */
const isbnSchema = z
  .string()
  .transform((v) => v.replace(/[-\s]/g, ''))
  .refine((v) => /^\d{9}[\dXx]$|^\d{13}$/.test(v), 'ISBN deve ter 10 ou 13 digitos');

export const createBookSchema = z.object({
  isbn: isbnSchema,
  title: z.string().trim().min(1).max(240),
  synopsis: z.string().trim().max(4000).optional(),
  publisher: z.string().trim().max(160).optional(),
  publishedYear: z
    .number()
    .int()
    .min(1450, 'Antes da prensa de Gutenberg nao ha livro impresso')
    .max(new Date().getFullYear() + 1)
    .optional(),
  categoryId: z.string().uuid().optional(),
  authorIds: z.array(z.string().uuid()).min(1, 'Informe ao menos um autor'),
});

export const updateBookSchema = createBookSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo' });

export const listBooksSchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  available: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  sort: z.enum(['title', '-title', 'publishedYear', '-publishedYear', 'createdAt', '-createdAt'])
    .default('title'),
});
