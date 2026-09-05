import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller';
import { changePasswordSchema, loginSchema, registerSchema } from './auth.schema';
import { validate } from '../../middlewares/validate';
import { autenticarToken } from '../../middlewares/auth';
import { asyncHandler } from '../../shared/asyncHandler';
import { env } from '../../config/env';

// Limite proprio: login e o endpoint que sofre forca bruta.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente em 15 min.' } },
  skip: () => env.NODE_ENV === 'test',
});

export const authRoutes = Router();

authRoutes.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  asyncHandler(authController.register),
);
authRoutes.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(authController.login),
);
// So o token, sem a trava de senha padrao: quem esta na senha da casa
// precisa justamente destas duas rotas para sair dela.
authRoutes.get("/me", autenticarToken, asyncHandler(authController.me));

authRoutes.post(
  "/change-password",
  autenticarToken,
  validate({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword),
);
