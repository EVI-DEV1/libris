/**
 * Gera o schema de produção trocando o provider de sqlite para postgresql.
 *
 * Por que não trocar direto no schema.prisma: SQLite é o que deixa `npm test`
 * rodar sem Docker e sem banco instalado — 29 testes que sobem e destroem um
 * arquivo. Trocar o provider na fonte custaria isso todo dia para ganhar uma
 * linha no deploy.
 *
 * Os dois provedores servem este schema sem nenhuma diferença de recurso: não
 * há tipo, índice ou função específicos de um deles aqui. Se um dia houver,
 * este atalho deixa de valer e o certo passa a ser Postgres em todo lugar.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const origem = 'prisma/schema.prisma';
const destino = 'prisma/schema.prod.prisma';

const schema = readFileSync(origem, 'utf8');
if (!schema.includes('provider = "sqlite"')) {
  console.error(`${origem} nao declara sqlite — o atalho de deploy virou mentira. Confira o schema.`);
  process.exit(1);
}

writeFileSync(destino, schema.replace('provider = "sqlite"', 'provider = "postgresql"'));
console.log(`${destino} gerado a partir de ${origem} (provider: postgresql)`);
