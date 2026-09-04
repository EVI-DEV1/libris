import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

export const createReservationSchema = z.object({
  bookId: z.string().uuid(),
  userId: z.string().uuid().optional(),
});

export const listReservationsSchema = paginationSchema.extend({
  bookId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['WAITING', 'READY', 'FULFILLED', 'CANCELLED', 'EXPIRED']).optional(),
});
