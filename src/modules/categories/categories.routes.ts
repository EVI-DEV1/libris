import { Router } from 'express';
import { categoriesService } from './categories.service';
import {
  createCategorySchema,
  idParamSchema,
  listCategoriesSchema,
  updateCategorySchema,
} from './categories.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const categoriesRoutes = Router();

categoriesRoutes.get(
  '/',
  validate({ query: listCategoriesSchema }),
  asyncHandler(async (req, res) => {
    res.json(await categoriesService.list(req.query as never));
  }),
);

categoriesRoutes.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await categoriesService.findById(req.params.id as string));
  }),
);

categoriesRoutes.post(
  '/',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ body: createCategorySchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await categoriesService.create(req.body));
  }),
);

categoriesRoutes.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ params: idParamSchema, body: updateCategorySchema }),
  asyncHandler(async (req, res) => {
    res.json(await categoriesService.update(req.params.id as string, req.body));
  }),
);

categoriesRoutes.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    await categoriesService.remove(req.params.id as string);
    res.status(204).send();
  }),
);
