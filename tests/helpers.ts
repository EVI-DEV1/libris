import request from 'supertest';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/prisma';
import { createApp } from '../src/app';

export const app = createApp();

export async function resetDatabase() {
  // Ordem importa: filhos antes dos pais, senao a FK reclama.
  await prisma.loan.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.copy.deleteMany();
  await prisma.bookAuthor.deleteMany();
  await prisma.book.deleteMany();
  await prisma.author.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function createUser(
  role: 'ADMIN' | 'LIBRARIAN' | 'MEMBER' = 'MEMBER',
  email = `${role.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}@teste.dev`,
) {
  return prisma.user.create({
    data: {
      name: `Usuario ${role}`,
      email,
      passwordHash: await bcrypt.hash('senha12345', 10),
      role,
    },
  });
}

export async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'senha12345' });
  return res.body.token as string;
}

/** Cria um livro com N exemplares disponiveis e devolve os ids que os testes usam. */
export async function seedBook(copies = 1) {
  const author = await prisma.author.create({ data: { name: `Autor ${Math.random()}` } });
  const book = await prisma.book.create({
    data: {
      isbn: String(Math.floor(1e12 + Math.random() * 8e12)),
      title: 'Livro de Teste',
      authors: { create: [{ authorId: author.id }] },
    },
  });

  const created = [];
  for (let i = 0; i < copies; i++) {
    created.push(
      await prisma.copy.create({
        data: { code: `T-${Math.random().toString(36).slice(2, 10)}`, bookId: book.id },
      }),
    );
  }

  return { author, book, copies: created };
}
