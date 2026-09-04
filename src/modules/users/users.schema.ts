import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

export const listUsersSchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  role: z.enum(['ADMIN', 'LIBRARIAN', 'MEMBER']).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(3).max(120).optional(),
    role: z.enum(['ADMIN', 'LIBRARIAN', 'MEMBER']).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo' });
