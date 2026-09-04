import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

export const createCopySchema = z.object({
  bookId: z.string().uuid(),
  code: z.string().trim().min(3).max(40).toUpperCase(),
  shelf: z.string().trim().max(40).optional(),
});

export const updateCopySchema = z
  .object({
    shelf: z.string().trim().max(40).optional(),
    // ON_LOAN nao entra: esse status so muda por emprestimo/devolucao.
    status: z.enum(['AVAILABLE', 'MAINTENANCE', 'LOST']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo' });

export const listCopiesSchema = paginationSchema.extend({
  bookId: z.string().uuid().optional(),
  status: z.enum(['AVAILABLE', 'ON_LOAN', 'RESERVED', 'MAINTENANCE', 'LOST']).optional(),
});
