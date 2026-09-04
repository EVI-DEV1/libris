import { Router } from 'express';
import { copiesService } from './copies.service';
import { createCopySchema, idParamSchema, listCopiesSchema, updateCopySchema } from './copies.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const copiesRoutes = Router();

copiesRoutes.use(authenticate);

copiesRoutes.get(
  '/',
  validate({ query: listCopiesSchema }),
  asyncHandler(async (req, res) => {
    res.json(await copiesService.list(req.query as never));
  }),
);

copiesRoutes.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await copiesService.findById(req.params.id as string));
  }),
);

copiesRoutes.post(
  '/',
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ body: createCopySchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await copiesService.create(req.body));
  }),
);

copiesRoutes.patch(
  '/:id',
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ params: idParamSchema, body: updateCopySchema }),
  asyncHandler(async (req, res) => {
    res.json(await copiesService.update(req.params.id as string, req.body));
  }),
);

copiesRoutes.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    await copiesService.remove(req.params.id as string);
    res.status(204).send();
  }),
);
