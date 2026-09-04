import { Router } from 'express';
import { reservationsService } from './reservations.service';
import {
  createReservationSchema,
  idParamSchema,
  listReservationsSchema,
} from './reservations.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const reservationsRoutes = Router();

reservationsRoutes.use(authenticate);

reservationsRoutes.get(
  '/',
  validate({ query: listReservationsSchema }),
  asyncHandler(async (req, res) => {
    res.json(await reservationsService.list(req.query as never, req.user!));
  }),
);

reservationsRoutes.post(
  '/',
  validate({ body: createReservationSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await reservationsService.create(req.body, req.user!));
  }),
);

reservationsRoutes.delete(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await reservationsService.cancel(req.params.id as string, req.user!));
  }),
);

// Rotina de manutencao da fila. Pode ser chamada por um cron externo.
reservationsRoutes.post(
  '/expire-stale',
  authorize('ADMIN', 'LIBRARIAN'),
  asyncHandler(async (_req, res) => {
    res.json(await reservationsService.expireStale());
  }),
);
