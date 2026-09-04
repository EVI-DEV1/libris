import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET precisa de ao menos 8 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  LOAN_DAYS: z.coerce.number().int().positive().default(14),
  MAX_ACTIVE_LOANS: z.coerce.number().int().positive().default(3),
  FINE_PER_DAY: z.coerce.number().nonnegative().default(1.5),
  MAX_RENEWALS: z.coerce.number().int().nonnegative().default(1),

  /// Senha que toda conta criada pela direcao recebe. O sistema obriga a
  /// troca no primeiro acesso, entao ela nunca e a senha de ninguem de fato.
  SENHA_PADRAO: z.string().min(8, "SENHA_PADRAO precisa de ao menos 8 caracteres").default("mudar@123"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Falha cedo e alto: subir com config invalida e o pior tipo de bug.
  console.error('Variaveis de ambiente invalidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
