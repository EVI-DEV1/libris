import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createUser, login, resetDatabase, seedBook } from './helpers';
import { prisma } from '../src/config/prisma';

describe('Catalogo', () => {
  beforeEach(resetDatabase);

  it('lista o acervo sem autenticacao', async () => {
    await seedBook(2);
    const res = await request(app).get('/api/v1/books');

    expect(res.status).toBe(200);
    expect(res.body.meta).toMatchObject({ page: 1, total: 1 });
    expect(res.body.data[0].totalCopies).toBe(2);
    expect(res.body.data[0].availableCopies).toBe(2);
  });

  it('a ficha da obra traz os exemplares, a lista nao', async () => {
    const { book, copies } = await seedBook(2);

    const ficha = await request(app).get(`/api/v1/books/${book.id}`);
    expect(ficha.status).toBe(200);
    expect(ficha.body.copies).toHaveLength(2);
    expect(ficha.body.copies.map((c: { code: string }) => c.code).sort()).toEqual(
      copies.map((c) => c.code).sort(),
    );
    expect(ficha.body.copies[0]).toHaveProperty('shelf');

    // Na lista o exemplar so alimenta a contagem: mandar todos custaria caro e
    // ninguem le. O que a lista promete e o numero, e ele tem que bater.
    const lista = await request(app).get('/api/v1/books');
    expect(lista.body.data[0].copies).toBeUndefined();
    expect(lista.body.data[0].availableCopies).toBe(2);
  });

  it('busca por nome do autor', async () => {
    const author = await prisma.author.create({ data: { name: 'Clarice Lispector' } });
    await prisma.book.create({
      data: {
        isbn: '9788520925829',
        title: 'A Hora da Estrela',
        authors: { create: [{ authorId: author.id }] },
      },
    });
    await seedBook(1);

    const res = await request(app).get('/api/v1/books?search=Clarice');

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].title).toBe('A Hora da Estrela');
  });

  it('exige papel de balcao para cadastrar obra', async () => {
    const member = await createUser('MEMBER');
    const token = await login(member.email);
    const author = await prisma.author.create({ data: { name: 'Autor X' } });

    const res = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ isbn: '9788535902778', title: 'Teste', authorIds: [author.id] });

    expect(res.status).toBe(403);
  });

  it('normaliza ISBN com hifen e recusa ISBN invalido', async () => {
    const librarian = await createUser('LIBRARIAN');
    const token = await login(librarian.email);
    const author = await prisma.author.create({ data: { name: 'Autor Y' } });

    const ok = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ isbn: '978-85-359-0277-8', title: 'Com hifen', authorIds: [author.id] });

    expect(ok.status).toBe(201);
    expect(ok.body.isbn).toBe('9788535902778');

    const ruim = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ isbn: '123', title: 'ISBN ruim', authorIds: [author.id] });

    expect(ruim.status).toBe(422);
  });

  it('recusa cadastro apontando para autor inexistente', async () => {
    const librarian = await createUser('LIBRARIAN');
    const token = await login(librarian.email);

    const res = await request(app)
      .post('/api/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .send({
        isbn: '9788535902778',
        title: 'Fantasma',
        authorIds: ['11111111-1111-1111-1111-111111111111'],
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/autores nao existem/);
  });

  it('responde 404 com corpo padronizado em rota inexistente', async () => {
    const res = await request(app).get('/api/v1/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
