import { Router } from 'express';
import { usersController } from './users.controller';
import { idParamSchema, listUsersSchema, updateUserSchema } from './users.schema';
import { validate } from '../../middlewares/validate';
import { authenticate, authorize } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';

export const usersRoutes = Router();

usersRoutes.use(authenticate, authorize('ADMIN', 'LIBRARIAN'));

usersRoutes.get('/', validate({ query: listUsersSchema }), asyncHandler(usersController.list));
usersRoutes.get('/:id', validate({ params: idParamSchema }), asyncHandler(usersController.show));
usersRoutes.patch(
  '/:id',
  authorize('ADMIN'),
  validate({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(usersController.update),
);
usersRoutes.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: idParamSchema }),
  asyncHandler(usersController.remove),
);
