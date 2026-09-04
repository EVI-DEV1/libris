import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Os testes de integracao compartilham um unico SQLite; rodar em paralelo
    // faria uma suite apagar a base da outra.
    fileParallelism: false,
    setupFiles: ['tests/setup.ts'],
    testTimeout: 20_000,
  },
});
