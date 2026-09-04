import request from 'supertest';

import { beforeEach, describe, expect, it } from 'vitest';
import { app, createUser, login, resetDatabase, seedBook } from './helpers';
import { prisma } from '../src/config/prisma';
import { calculateFine, daysLate } from '../src/modules/loans/loans.service';

const DAY = 24 * 60 * 60 * 1000;

describe('Emprestimos', () => {
  beforeEach(resetDatabase);

  it('empresta um exemplar disponivel e marca ON_LOAN', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const { copies } = await seedBook(1);

    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[0]!.id });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ACTIVE');
    expect(new Date(res.body.dueAt).getTime()).toBeGreaterThan(Date.now());

    const copy = await prisma.copy.findUnique({ where: { id: copies[0]!.id } });
    expect(copy?.status).toBe('ON_LOAN');
  });

  it('recusa exemplar ja emprestado com 409', async () => {
    const a = await createUser('MEMBER');
    const b = await createUser('MEMBER');
    const { copies } = await seedBook(1);

    const tokenA = await login(a.email);
    const tokenB = await login(b.email);

    await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ copyId: copies[0]!.id });

    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ copyId: copies[0]!.id });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/ja esta emprestado/);
  });

  it('respeita o limite de emprestimos simultaneos', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const { copies } = await seedBook(4); // limite do ambiente de teste e 3

    for (let i = 0; i < 3; i++) {
      const ok = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${token}`)
        .send({ copyId: copies[i]!.id });
      expect(ok.status).toBe(201);
    }

    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[3]!.id });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/Limite de 3/);
  });

  it('bloqueia novo emprestimo para quem esta em atraso', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const { copies } = await seedBook(2);

    await prisma.loan.create({
      data: {
        userId: member.id,
        copyId: copies[0]!.id,
        dueAt: new Date(Date.now() - 3 * DAY),
      },
    });

    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[1]!.id });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/atraso/);
  });

  it('impede que MEMBER empreste em nome de outro', async () => {
    const member = await createUser('MEMBER');
    const outro = await createUser('MEMBER');
    const token = await login(member.email);
    const { copies } = await seedBook(1);

    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[0]!.id, userId: outro.id });

    expect(res.status).toBe(403);
  });

  it('devolve no prazo sem multa e libera o exemplar', async () => {
    const member = await createUser('MEMBER');
    const balcao = await createUser('LIBRARIAN');
    const tokenMember = await login(member.email);
    const tokenBalcao = await login(balcao.email);
    const { copies } = await seedBook(1);

    const emprestimo = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenMember}`)
      .send({ copyId: copies[0]!.id });

    const res = await request(app)
      .post(`/api/v1/loans/${emprestimo.body.id}/return`)
      .set('Authorization', `Bearer ${tokenBalcao}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('RETURNED');
    expect(res.body.fine).toBe(0);

    const copy = await prisma.copy.findUnique({ where: { id: copies[0]!.id } });
    expect(copy?.status).toBe('AVAILABLE');
  });

  it('cobra multa proporcional aos dias de atraso', async () => {
    const member = await createUser('MEMBER');
    const balcao = await createUser('LIBRARIAN');
    const tokenBalcao = await login(balcao.email);
    const { copies } = await seedBook(1);

    const loan = await prisma.loan.create({
      data: {
        userId: member.id,
        copyId: copies[0]!.id,
        // 3 dias e 23h de atraso: o quarto dia ja comecou, entao conta como 4.
        dueAt: new Date(Date.now() - 4 * DAY + 60 * 60 * 1000),
      },
    });
    await prisma.copy.update({ where: { id: copies[0]!.id }, data: { status: 'ON_LOAN' } });

    const res = await request(app)
      .post(`/api/v1/loans/${loan.id}/return`)
      .set('Authorization', `Bearer ${tokenBalcao}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('LATE');
    expect(res.body.fine).toBe(6); // 4 dias x R$ 1,50
  });

  it('nao deixa MEMBER registrar a propria devolucao', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const { copies } = await seedBook(1);

    const emprestimo = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[0]!.id });

    const res = await request(app)
      .post(`/api/v1/loans/${emprestimo.body.id}/return`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('renova uma vez e bloqueia a segunda', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const { copies } = await seedBook(1);

    const emprestimo = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[0]!.id });

    const primeira = await request(app)
      .post(`/api/v1/loans/${emprestimo.body.id}/renew`)
      .set('Authorization', `Bearer ${token}`);
    expect(primeira.status).toBe(200);
    expect(primeira.body.renewals).toBe(1);
    expect(new Date(primeira.body.dueAt).getTime()).toBeGreaterThan(
      new Date(emprestimo.body.dueAt).getTime(),
    );

    const segunda = await request(app)
      .post(`/api/v1/loans/${emprestimo.body.id}/renew`)
      .set('Authorization', `Bearer ${token}`);
    expect(segunda.status).toBe(409);
  });

  it('MEMBER so enxerga os proprios emprestimos na listagem', async () => {
    const a = await createUser('MEMBER');
    const b = await createUser('MEMBER');
    const { copies } = await seedBook(2);

    const tokenA = await login(a.email);
    const tokenB = await login(b.email);

    await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ copyId: copies[0]!.id });
    await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ copyId: copies[1]!.id });

    // Mesmo pedindo explicitamente os emprestimos de B, A so recebe os seus.
    const res = await request(app)
      .get(`/api/v1/loans?userId=${b.id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].userId).toBe(a.id);
  });
});

describe('Calculo de multa (unitario)', () => {
  it('nao cobra devolucao no dia do vencimento', () => {
    const due = new Date('2026-09-04T18:00:00Z');
    expect(daysLate(due, new Date('2026-09-04T09:00:00Z'))).toBe(0);
    expect(calculateFine(due, new Date('2026-09-04T09:00:00Z'), 1.5)).toBe(0);
  });

  it('arredonda dia iniciado para cima', () => {
    const due = new Date('2026-09-01T12:00:00Z');
    expect(daysLate(due, new Date('2026-09-02T01:00:00Z'))).toBe(1);
    expect(calculateFine(due, new Date('2026-09-04T12:00:00Z'), 2)).toBe(6);
  });
});
