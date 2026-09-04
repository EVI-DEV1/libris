import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'Nome precisa de ao menos 3 caracteres').max(120),
  email: z.string().email('E-mail invalido').toLowerCase(),
  password: z.string().min(8, 'Senha precisa de ao menos 8 caracteres').max(72),
});

export const loginSchema = z.object({
  email: z.string().email('E-mail invalido').toLowerCase(),
  password: z.string().min(1, 'Senha obrigatoria'),
});

export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1, "Informe a senha atual"),
  senhaNova: z.string().min(8, "A nova senha precisa de ao menos 8 caracteres").max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
