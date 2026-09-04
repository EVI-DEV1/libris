import { execSync } from 'node:child_process';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, afterAll } from 'vitest';

const TEST_DB = path.resolve(__dirname, 'test.db');

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `file:${TEST_DB}`;
process.env.JWT_SECRET = 'segredo-de-teste-1234567890';
process.env.LOAN_DAYS = '14';
process.env.MAX_ACTIVE_LOANS = '3';
process.env.FINE_PER_DAY = '1.5';
process.env.MAX_RENEWALS = '1';

beforeAll(() => {
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  // Base zerada a cada execucao: teste que depende de estado anterior nao e teste.
  execSync('npx prisma db push --skip-generate --accept-data-loss', {
    stdio: 'ignore',
    env: process.env,
  });
});

afterAll(async () => {
  const { prisma } = await import('../src/config/prisma');
  await prisma.$disconnect();
});
