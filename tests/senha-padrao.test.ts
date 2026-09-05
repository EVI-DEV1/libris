import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createUser, login, resetDatabase } from './helpers';
import { env } from '../src/config/env';

/**
 * A conta criada pela direcao nasce na senha da casa. Enquanto estiver nela,
 * ela nao e uma conta: e uma conta pela metade, e a metade que falta e a senha
 * que so a pessoa sabe. Esconder as telas era cortesia; quem recusa e o
 * servidor, porque com o token na mao as telas nao existem.
 */
describe('Trava da senha padrao', () => {
  beforeEach(resetDatabase);

  async function contaNova() {
    const admin = await createUser('ADMIN');
    const tokenAdmin = await login(admin.email);

    const criada = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ name: 'Recepcao Teste', email: 'recepcao@teste.dev', role: 'LIBRARIAN' });

    expect(criada.status).toBe(201);
    expect(criada.body.mustChangePassword).toBe(true);
    expect(criada.body).not.toHaveProperty('passwordHash');

    const entrada = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'recepcao@teste.dev', password: env.SENHA_PADRAO });

    expect(entrada.status).toBe(200);
    return entrada.body.token as string;
  }

  it('recusa o resto da API enquanto a conta esta na senha da casa', async () => {
    const token = await contaNova();

    const emprestimos = await request(app)
      .get('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`);

    expect(emprestimos.status).toBe(403);
    expect(emprestimos.body.error.code).toBe('SENHA_PADRAO');
  });

  it('deixa passar so o que serve para sair da senha da casa', async () => {
    const token = await contaNova();

    const eu = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(eu.status).toBe(200);
    expect(eu.body.mustChangePassword).toBe(true);

    const troca = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ senhaAtual: env.SENHA_PADRAO, senhaNova: 'senha-minha-9876' });

    expect(troca.status).toBe(200);

    const depois = await request(app)
      .get('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`);
    expect(depois.status).toBe(200);
  });

  it('o reset da direcao derruba a sessao que ja estava aberta', async () => {
    const admin = await createUser('ADMIN');
    const tokenAdmin = await login(admin.email);
    const funcionario = await createUser('LIBRARIAN');
    const tokenDele = await login(funcionario.email);

    // A sessao dele estava valendo antes do reset.
    const antes = await request(app).get('/api/v1/loans').set('Authorization', `Bearer ${tokenDele}`);
    expect(antes.status).toBe(200);

    const reset = await request(app)
      .post(`/api/v1/users/${funcionario.id}/reset-password`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(reset.status).toBe(204);

    // O token dele nao expirou; a conta e que voltou a ser meia conta. Se a
    // trava estivesse dentro do token, esta sessao continuaria valendo.
    const depois = await request(app).get('/api/v1/loans').set('Authorization', `Bearer ${tokenDele}`);
    expect(depois.status).toBe(403);
    expect(depois.body.error.code).toBe('SENHA_PADRAO');
  });
});
