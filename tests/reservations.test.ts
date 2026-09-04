import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createUser, login, resetDatabase, seedBook } from './helpers';
import { prisma } from '../src/config/prisma';

describe('Reservas', () => {
  beforeEach(resetDatabase);

  it('recusa reserva quando ha exemplar na prateleira', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const { book } = await seedBook(1);

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({ bookId: book.id });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/disponivel/);
  });

  it('entra na fila e informa a posicao', async () => {
    const a = await createUser('MEMBER');
    const b = await createUser('MEMBER');
    const c = await createUser('MEMBER');
    const { book, copies } = await seedBook(1);

    const tokenA = await login(a.email);
    await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ copyId: copies[0]!.id });

    const primeira = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${await login(b.email)}`)
      .send({ bookId: book.id });
    const segunda = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${await login(c.email)}`)
      .send({ bookId: book.id });

    expect(primeira.status).toBe(201);
    expect(primeira.body.posicaoNaFila).toBe(1);
    expect(segunda.body.posicaoNaFila).toBe(2);
  });

  it('devolucao promove a primeira reserva da fila e separa o exemplar', async () => {
    const leitorAtual = await createUser('MEMBER');
    const naFila = await createUser('MEMBER');
    const balcao = await createUser('LIBRARIAN');
    const { book, copies } = await seedBook(1);

    const tokenAtual = await login(leitorAtual.email);
    const emprestimo = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${tokenAtual}`)
      .send({ copyId: copies[0]!.id });

    const tokenFila = await login(naFila.email);
    const reserva = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${tokenFila}`)
      .send({ bookId: book.id });

    const devolucao = await request(app)
      .post(`/api/v1/loans/${emprestimo.body.id}/return`)
      .set('Authorization', `Bearer ${await login(balcao.email)}`);

    expect(devolucao.status).toBe(200);
    expect(devolucao.body.reservaAcionada).toBe(reserva.body.id);

    const copy = await prisma.copy.findUnique({ where: { id: copies[0]!.id } });
    expect(copy?.status).toBe('RESERVED');

    const atualizada = await prisma.reservation.findUnique({ where: { id: reserva.body.id } });
    expect(atualizada?.status).toBe('READY');
    expect(atualizada?.expiresAt).toBeTruthy();
  });

  it('exemplar separado no balcao nao sai para outro leitor', async () => {
    const naFila = await createUser('MEMBER');
    const intruso = await createUser('MEMBER');
    const { book, copies } = await seedBook(1);

    await prisma.copy.update({ where: { id: copies[0]!.id }, data: { status: 'RESERVED' } });
    await prisma.reservation.create({
      data: { bookId: book.id, userId: naFila.id, status: 'READY' },
    });

    const res = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${await login(intruso.email)}`)
      .send({ copyId: copies[0]!.id });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/reservado para outro/);

    // Mas sai para quem esta na frente da fila, e a reserva vira FULFILLED.
    const ok = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${await login(naFila.email)}`)
      .send({ copyId: copies[0]!.id });

    expect(ok.status).toBe(201);
    const reserva = await prisma.reservation.findFirst({ where: { userId: naFila.id } });
    expect(reserva?.status).toBe('FULFILLED');
  });

  it('renovacao e bloqueada quando ha fila de reserva', async () => {
    const leitor = await createUser('MEMBER');
    const naFila = await createUser('MEMBER');
    const { book, copies } = await seedBook(1);

    const token = await login(leitor.email);
    const emprestimo = await request(app)
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({ copyId: copies[0]!.id });

    await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${await login(naFila.email)}`)
      .send({ bookId: book.id });

    const res = await request(app)
      .post(`/api/v1/loans/${emprestimo.body.id}/renew`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/reserva na fila/);
  });

  it('expira reserva nao retirada e devolve o exemplar a prateleira', async () => {
    const naFila = await createUser('MEMBER');
    const balcao = await createUser('LIBRARIAN');
    const { book, copies } = await seedBook(1);

    await prisma.copy.update({ where: { id: copies[0]!.id }, data: { status: 'RESERVED' } });
    await prisma.reservation.create({
      data: {
        bookId: book.id,
        userId: naFila.id,
        status: 'READY',
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const res = await request(app)
      .post('/api/v1/reservations/expire-stale')
      .set('Authorization', `Bearer ${await login(balcao.email)}`);

    expect(res.status).toBe(200);
    expect(res.body.expiradas).toBe(1);

    const copy = await prisma.copy.findUnique({ where: { id: copies[0]!.id } });
    expect(copy?.status).toBe('AVAILABLE');
  });
});
