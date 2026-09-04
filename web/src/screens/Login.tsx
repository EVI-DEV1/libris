import { useState } from 'react';
import { api, ApiError, token } from '../api/client';
import type { User } from '../api/types';
import { brand } from '../brand';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Recado } from '../ui/kit';

export function Login({ onEntrar }: { onEntrar: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await api.login(email, senha);
      if (r.user.role === 'MEMBER') {
        // A API aceita o leitor; esta tela não é dele. Dizer isso é melhor do
        // que deixar entrar numa interface onde nada funciona.
        setErro('Esta tela é do balcão. Contas de leitor ainda não têm acesso.');
        return;
      }
      token.set(r.token);
      onEntrar(r.user);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não consegui entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="entrada">
      <div className="entrada-caixa surge">
        <span className="entrada-selo" aria-hidden>
          <Icon name="acervo" size={26} />
        </span>

        <div>
          <h1 style={{ fontSize: 28 }}>{brand.name}</h1>
          <p className="sub" style={{ margin: 'calc(var(--u) * 1) 0 0', fontSize: 15 }}>
            {brand.tagline}
          </p>
        </div>

        <form onSubmit={entrar} style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
          <Campo
            id="email"
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoFocus
          />
          <Campo id="senha" label="Senha" type="password" value={senha} onChange={setSenha} />

          {erro ? <Recado tipo="trava">{erro}</Recado> : null}

          <Btn type="submit" variant="acao" loading={enviando} full icone="seta">
            {enviando ? 'Entrando' : 'Entrar'}
          </Btn>
        </form>

        <p className="sub" style={{ margin: 0, textAlign: 'center', fontSize: 13 }}>
          Demonstração · balcao@biblioteca.dev · admin12345
        </p>
      </div>

      <style>{`
        .entrada {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: calc(var(--u) * 6);
          /* Um campo de cor que respira, para a entrada não ser um formulário
             solto no branco. */
          background: var(--fundo);
          background-attachment: fixed;
        }
        .entrada-caixa {
          width: min(400px, 100%);
          display: grid;
          gap: calc(var(--u) * 6);
          background: var(--papel);
          border: 1px solid var(--linha);
          border-radius: 20px;
          padding: calc(var(--u) * 9) calc(var(--u) * 8);
          box-shadow: var(--sombra-3);
        }
        .entrada-selo {
          width: 52px; height: 52px;
          border-radius: 15px;
          background-image: var(--gradiente-forte);
          color: #fff;
          display: grid; place-items: center;
          box-shadow: var(--sombra-acao);
        }
      `}</style>
    </main>
  );
}
