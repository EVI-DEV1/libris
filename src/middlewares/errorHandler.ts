import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../shared/AppError';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `Rota ${req.method} ${req.originalUrl} nao existe` },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const alvo = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'campo unico';
      res.status(409).json({
        error: { code: 'CONFLICT', message: `Ja existe um registro com esse ${alvo}` },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Registro nao encontrado' } });
      return;
    }
  }

  logger.error({ err }, 'Erro nao tratado');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      ...(env.NODE_ENV === 'development' && { stack: (err as Error)?.stack }),
    },
  });
}
