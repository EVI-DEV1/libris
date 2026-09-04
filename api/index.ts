/**
 * Entrada serverless da API na Vercel.
 *
 * O `src/app.ts` foi escrito sem `listen` desde o primeiro dia — o que existia
 * para o Supertest montar a aplicação em memória serve aqui sem adaptação
 * nenhuma: a Vercel também quer o handler, não o servidor.
 *
 * O `src/server.ts` continua sendo o caminho para rodar num processo próprio.
 */
import { createApp } from '../src/app';

export default createApp();
