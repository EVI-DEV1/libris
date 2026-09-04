import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });
export const createCategorySchema = z.object({ name: z.string().trim().min(2).max(80) });
export const updateCategorySchema = createCategorySchema;
export const listCategoriesSchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
});
