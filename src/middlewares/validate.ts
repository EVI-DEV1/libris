import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type AnyZodObject, type ZodTypeAny } from 'zod';
import { AppError } from '../shared/AppError';

type Schemas = {
  body?: ZodTypeAny;
  query?: AnyZodObject;
  params?: AnyZodObject;
};

/**
 * Valida e SUBSTITUI req.body/query/params pelo dado ja parseado.
 * A partir do controller, o tipo vindo do Zod e a verdade — nada de `any`.
 */
export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, 'query', { value: parsed, writable: true });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          AppError.unprocessable(
            'Dados invalidos',
            err.issues.map((i) => ({ campo: i.path.join('.'), erro: i.message })),
          ),
        );
        return;
      }
      next(err);
    }
  };
}
