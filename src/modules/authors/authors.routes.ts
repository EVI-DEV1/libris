import { Router } from 'express';
import { authorsService } from './authors.service';
import {
  createAuthorSchema,
  idParamSchema,
  listAuthorsSchema,
  updateAuthorSchema,
} from './authors.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const authorsRoutes = Router();

authorsRoutes.get(
  '/',
  validate({ query: listAuthorsSchema }),
  asyncHandler(async (req, res) => {
    res.json(await authorsService.list(req.query as never));
  }),
);

authorsRoutes.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await authorsService.findById(req.params.id as string));
  }),
);

authorsRoutes.post(
  '/',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ body: createAuthorSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await authorsService.create(req.body));
  }),
);

authorsRoutes.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ params: idParamSchema, body: updateAuthorSchema }),
  asyncHandler(async (req, res) => {
    res.json(await authorsService.update(req.params.id as string, req.body));
  }),
);

authorsRoutes.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    await authorsService.remove(req.params.id as string);
    res.status(204).send();
  }),
);
