import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

export const createLoanSchema = z.object({
  copyId: z.string().uuid(),
  /** Opcional: so bibliotecario pode emprestar em nome de outro usuario. */
  userId: z.string().uuid().optional(),
});

export const listLoansSchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'RETURNED', 'LATE']).optional(),
  overdue: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
