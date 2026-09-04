/**
 * Sobe o Libris para a Vercel a partir de uma exportação limpa do commit atual.
 *
 * POR QUE NÃO `vercel deploy` direto na pasta do projeto:
 * subindo da pasta de trabalho, o build nunca começava — o deployment ficava
 * preso em BLOCKED, sem uma única linha de log, indefinidamente. Da mesma
 * árvore exportada com `git archive`, o mesmo commit e a mesma configuração
 * constroem em segundos. A pasta de trabalho carrega coisa que o deploy não
 * deveria ver (node_modules dos dois pacotes, dist, .git, capturas de
 * revisão), e alguma delas trava o envio.
 *
 * O efeito colateral é bom: sobe exatamente o que está commitado. Alteração
 * não commitada não vaza para produção por engano.
 *
 * Uso:  node scripts/deploy.mjs            (produção)
 *       node scripts/deploy.mjs --preview  (preview)
 */
import { execFileSync, execSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const preview = process.argv.includes('--preview');

const sujo = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
if (sujo) {
  console.error('Há alterações não commitadas. O deploy sobe o commit, não a pasta:');
  console.error(sujo);
  console.error('\nCommite (ou guarde com git stash) e rode de novo.');
  process.exit(1);
}

const destino = mkdtempSync(join(tmpdir(), 'libris-deploy-'));

try {
  console.log(`Exportando o commit atual para ${destino}`);
  execSync(`git archive HEAD | tar -x -C "${destino}"`, { stdio: 'inherit', shell: 'bash' });

  console.log('Vinculando ao projeto libris');
  execFileSync('npx', ['vercel', 'link', '--yes', '--project', 'libris'], {
    cwd: destino,
    stdio: 'inherit',
    shell: true,
  });

  console.log(`Subindo (${preview ? 'preview' : 'produção'})`);
  execFileSync('npx', ['vercel', 'deploy', '--yes', ...(preview ? [] : ['--prod'])], {
    cwd: destino,
    stdio: 'inherit',
    shell: true,
  });
} finally {
  rmSync(destino, { recursive: true, force: true });
}
