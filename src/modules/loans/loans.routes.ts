import { Router } from 'express';
import { loansService } from './loans.service';
import { createLoanSchema, idParamSchema, listLoansSchema } from './loans.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const loansRoutes = Router();

loansRoutes.use(authenticate);

loansRoutes.get(
  '/',
  validate({ query: listLoansSchema }),
  asyncHandler(async (req, res) => {
    res.json(await loansService.list(req.query as never, req.user!));
  }),
);

loansRoutes.get(
  '/:id',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await loansService.findById(req.params.id as string, req.user!));
  }),
);

loansRoutes.post(
  '/',
  validate({ body: createLoanSchema }),
  asyncHandler(async (req, res) => {
    res.status(201).json(await loansService.create(req.body, req.user!));
  }),
);

// Devolucao passa pelo balcao: quem confere o estado fisico do exemplar e o funcionario.
loansRoutes.post(
  '/:id/return',
  authorize('ADMIN', 'LIBRARIAN'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await loansService.giveBack(req.params.id as string));
  }),
);

loansRoutes.post(
  '/:id/renew',
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    res.json(await loansService.renew(req.params.id as string, req.user!));
  }),
);
