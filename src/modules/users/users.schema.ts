import { z } from 'zod';
import { paginationSchema } from '../../shared/pagination';

export const idParamSchema = z.object({ id: z.string().uuid('Id invalido') });

export const listUsersSchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  role: z.enum(['ADMIN', 'LIBRARIAN', 'MEMBER']).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

/**
 * Criacao de conta de equipe. So a direcao faz, e a senha nao vem no corpo:
 * ela e sempre a SENHA_PADRAO do ambiente, com troca obrigatoria no primeiro
 * acesso. Deixar quem cria escolher a senha do outro e pedir para a senha
 * virar recado de papel colado no monitor.
 */
export const createStaffSchema = z.object({
  name: z.string().trim().min(3, "Nome precisa de ao menos 3 caracteres").max(120),
  email: z.string().email("E-mail invalido").toLowerCase(),
  role: z.enum(["ADMIN", "LIBRARIAN"], {
    errorMap: () => ({ message: "Papel deve ser ADMIN ou LIBRARIAN" }),
  }),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(3).max(120).optional(),
    role: z.enum(['ADMIN', 'LIBRARIAN', 'MEMBER']).optional(),
    active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Envie ao menos um campo' });
