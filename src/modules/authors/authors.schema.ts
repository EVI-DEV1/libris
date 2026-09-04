import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

export const createAuthorSchema = z.object({
  name: z.string().trim().min(2).max(160),
  bio: z.string().trim().max(2000).optional(),
});

export const updateAuthorSchema = createAuthorSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo' });

export const listAuthorsSchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
});
