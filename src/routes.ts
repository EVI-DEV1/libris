import { Router } from 'express';
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { authorsRoutes } from './modules/authors/authors.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { booksRoutes } from './modules/books/books.routes';
import { copiesRoutes } from './modules/copies/copies.routes';
import { loansRoutes } from './modules/loans/loans.routes';
import { reservationsRoutes } from './modules/reservations/reservations.routes';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);
routes.use('/authors', authorsRoutes);
routes.use('/categories', categoriesRoutes);
routes.use('/books', booksRoutes);
routes.use('/copies', copiesRoutes);
routes.use('/loans', loansRoutes);
routes.use('/reservations', reservationsRoutes);
