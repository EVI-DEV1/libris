import { useState } from 'react';
import { api, ApiError, token } from '../api/client';
import type { User } from '../api/types';
import { brand } from '../brand';
import { Btn, Field, Recado } from '../ui/kit';

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
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 'calc(var(--u) * 5)',
        background: 'var(--mid)',
      }}
    >
      <div style={{ width: 'min(420px, 100%)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--u) * 3)',
            marginBottom: 'calc(var(--u) * 5)',
          }}
        >
          <span className="dither" style={{ width: 40, height: 40, borderRadius: 4 }} aria-hidden />
          <div>
            <h1 style={{ marginBottom: 2 }}>{brand.name}</h1>
            <p className="label" style={{ margin: 0 }}>
              {brand.tagline}
            </p>
          </div>
        </div>

        <form onSubmit={entrar} className="win" style={{ padding: 'calc(var(--u) * 5)' }}>
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
            <Field
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoFocus
            />
            <Field
              id="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={setSenha}
            />

            {erro ? <Recado kind="bloqueio">{erro}</Recado> : null}

            <Btn type="submit" variant="primary" loading={enviando} full icon="seta">
              {enviando ? 'Entrando' : 'Entrar no balcão'}
            </Btn>
          </div>
        </form>

        <p className="dado" style={{ marginTop: 'calc(var(--u) * 4)', textAlign: 'center' }}>
          Dados de demonstração · balcao@biblioteca.dev · admin12345
        </p>
      </div>
    </main>
  );
}
