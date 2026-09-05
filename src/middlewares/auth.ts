import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { AppError } from '../shared/AppError';
import { asyncHandler } from '../shared/asyncHandler';

export type Role = 'ADMIN' | 'LIBRARIAN' | 'MEMBER';

export interface AuthPayload {
  sub: string;
  role: Role;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * So confere o token. Use direto apenas onde a conta precisa entrar mesmo
 * estando na senha padrao — ou seja, na propria troca de senha e no /me que a
 * tela consulta para saber que e isso que ela tem que pedir.
 */
export function autenticarToken(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Token ausente. Envie Authorization: Bearer <token>');
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    next();
  } catch {
    throw AppError.unauthorized('Token invalido ou expirado');
  }
}

/**
 * Token valido E conta com senha propria. Este e o `authenticate` que o resto
 * da API usa, e ser este o padrao e proposital: rota nova nasce protegida, e
 * esquecer a trava passa a ser impossivel em vez de so improvavel.
 *
 * A flag e lida do banco a cada requisicao, nao do token. Custa uma consulta e
 * paga duas coisas: um token emitido antes da direcao resetar a senha para de
 * valer na hora, e a trava nao depende de o cliente ter recarregado a sessao.
 * Esconder a tela era cortesia; a recusa e aqui.
 */
const comSenhaPropria = async (req: Request, res: Response, next: NextFunction) => {
  autenticarToken(req, res, () => undefined);

  const conta = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { mustChangePassword: true },
  });
  if (!conta) throw AppError.unauthorized('Conta nao existe mais');
  if (conta.mustChangePassword) {
    throw new AppError(
      'Esta conta ainda esta na senha padrao. Troque a senha em POST /auth/change-password antes de usar o sistema.',
      403,
      'SENHA_PADRAO',
    );
  }

  next();
};

/*
 * asyncHandler: em Express 4 uma promessa rejeitada dentro de middleware nao
 * chega ao tratador de erro — viraria requisicao pendurada em vez de 403.
 */
export const authenticate = asyncHandler(comSenhaPropria);

/** Autoriza apenas os papeis listados. Use sempre DEPOIS de `authenticate`. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };
}
