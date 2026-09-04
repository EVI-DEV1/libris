import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createUser, resetDatabase } from './helpers';

describe('Autenticacao', () => {
  beforeEach(resetDatabase);

  it('cadastra um leitor e devolve token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Maria Andrade',
      email: 'maria@teste.dev',
      password: 'senha-forte-123',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('MEMBER');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('recusa e-mail duplicado com 409', async () => {
    const payload = { name: 'Maria', email: 'dup@teste.dev', password: 'senha-forte-123' };
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('recusa senha curta com 422 e aponta o campo', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Maria', email: 'curta@teste.dev', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.error.details).toContainEqual(
      expect.objectContaining({ campo: 'password' }),
    );
  });

  it('nao diferencia e-mail inexistente de senha errada', async () => {
    await createUser('MEMBER', 'existe@teste.dev');

    const inexistente = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nao-existe@teste.dev', password: 'senha12345' });
    const senhaErrada = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'existe@teste.dev', password: 'errada12345' });

    expect(inexistente.status).toBe(401);
    expect(senhaErrada.status).toBe(401);
    expect(inexistente.body.error.message).toBe(senhaErrada.body.error.message);
  });

  it('bloqueia /me sem token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
