import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { routes } from './routes';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { openapiDocument } from './docs/openapi';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(pinoHttp({ logger, autoLogging: env.NODE_ENV !== 'test' }));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 120,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      // Suite de teste dispara centenas de requests do mesmo IP.
      skip: () => env.NODE_ENV === 'test',
    }),
  );

  // Health check com toque real no banco: um /health que so responde "ok"
  // continua verde com o banco caido.
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up', uptime: process.uptime() });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.get('/api/openapi.json', (_req, res) => res.json(openapiDocument));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
