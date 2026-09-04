import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 nao captura rejeicao de promise sozinho. Sem isso, todo await
 * que falha vira request pendurado em vez de resposta de erro.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
