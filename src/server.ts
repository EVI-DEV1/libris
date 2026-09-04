import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`API da biblioteca no ar em http://localhost:${env.PORT}`);
  logger.info(`Documentacao em http://localhost:${env.PORT}/api/docs`);
});

// Encerramento limpo: sem isso, um deploy derruba requisicoes no meio do voo.
async function shutdown(signal: string) {
  logger.info(`${signal} recebido, encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
