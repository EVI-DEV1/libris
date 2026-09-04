import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { User } from '../api/types';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Recado } from '../ui/kit';

/**
 * Trava de primeiro acesso.
 *
 * Conta criada pela direção nasce com a senha padrão da casa — a mesma para
 * todo mundo. Se ela pudesse continuar assim, "senha" viraria só uma palavra
 * que a equipe inteira sabe. Esta tela é a única coisa que a pessoa vê até
 * escolher uma senha própria; não tem como pular.
 */
export function TrocarSenha({ user, onTrocada }: { user: User; onTrocada: (u: User) => void }) {
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [repetida, setRepetida] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (nova !== repetida) {
      setErro('As duas senhas novas não são iguais.');
      return;
    }
    if (nova.length < 8) {
      setErro('A nova senha precisa de ao menos 8 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      onTrocada(await api.trocarSenha(atual, nova));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não consegui trocar a senha.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="entrada">
      <div className="entrada-caixa surge">
        <span className="selo-troca" aria-hidden>
          <Icon name="chave" size={26} />
        </span>

        <div>
          <h1 style={{ fontSize: 26 }}>Escolha sua senha</h1>
          <p className="sub" style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15 }}>
            Olá, {user.name.split(' ')[0]}. Sua conta ainda está com a senha padrão da casa, que
            todo mundo conhece. Escolha uma sua para continuar.
          </p>
        </div>

        <form onSubmit={salvar} style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
          <Campo
            id="atual"
            label="Senha atual"
            type="password"
            value={atual}
            onChange={setAtual}
            autoFocus
            dica="É a senha padrão que a direção passou para você."
          />
          <Campo
            id="nova"
            label="Nova senha"
            type="password"
            value={nova}
            onChange={setNova}
            dica="Ao menos 8 caracteres."
          />
          <Campo
            id="repetida"
            label="Repita a nova senha"
            type="password"
            value={repetida}
            onChange={setRepetida}
          />

          {erro ? <Recado tipo="trava">{erro}</Recado> : null}

          <Btn type="submit" variant="acao" loading={enviando} full icone="check">
            {enviando ? 'Salvando' : 'Salvar e entrar'}
          </Btn>
        </form>
      </div>

      <style>{`
        .entrada {
          min-height: 100dvh; display: grid; place-items: center;
          padding: calc(var(--u) * 6);
          background: var(--fundo); background-attachment: fixed;
        }
        .entrada-caixa {
          width: min(420px, 100%); display: grid; gap: calc(var(--u) * 6);
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: 20px; padding: calc(var(--u) * 9) calc(var(--u) * 8);
          box-shadow: var(--sombra-3);
        }
        .selo-troca {
          width: 52px; height: 52px; border-radius: 15px;
          background-image: var(--gradiente-forte); color: #fff;
          display: grid; place-items: center; box-shadow: var(--sombra-acao);
        }
      `}</style>
    </main>
  );
}
