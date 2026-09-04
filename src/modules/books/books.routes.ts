import { Router } from 'express';
import { booksService } from './books.service';
import { createBookSchema, idParamSchema, listBooksSchema, updateBookSchema } from './books.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const booksRoutes = Router();

// Consulta ao acervo e publica: catalogo de biblioteca nao pede login.
booksRoutes.get(
  '/',
  validate({ query: listBooksSchema }),
  asyncHandler(async (req, res) => {
    res.json(await booksService.list(req.query as never));
  }),
);

booksRoutes.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await booksService.findById(req.params.id as string));
  }),
);

booksRoutes.post(
  '/',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ body: createBookSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await booksService.create(req.body));
  }),
);

booksRoutes.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ params: idParamSchema, body: updateBookSchema }),
  asyncHandler(async (req, res) => {
    res.json(await booksService.update(req.params.id as string, req.body));
  }),
);

booksRoutes.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    await booksService.remove(req.params.id as string);
    res.status(204).send();
  }),
);
