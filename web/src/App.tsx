import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, token } from './api/client';
import type { User } from './api/types';
import { brand } from './brand';
import { PixelIcon } from './ui/PixelIcon';
import type { IconName } from './ui/PixelIcon';
import { Btn, Carregando } from './ui/kit';
import { Login } from './screens/Login';
import { Balcao } from './screens/Balcao';
import { Acervo } from './screens/Acervo';
import { Emprestimos } from './screens/Emprestimos';
import { Reservas } from './screens/Reservas';

type Tarefa = 'balcao' | 'acervo' | 'emprestimos' | 'reservas';

const TAREFAS: { id: Tarefa; nome: string; icon: IconName }[] = [
  { id: 'balcao', nome: 'Balcão', icon: 'emprestar' },
  { id: 'acervo', nome: 'Acervo', icon: 'acervo' },
  { id: 'emprestimos', nome: 'Empréstimos', icon: 'devolver' },
  { id: 'reservas', nome: 'Reservas', icon: 'reserva' },
];

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tarefa, setTarefa] = useState<Tarefa>('balcao');

  useEffect(() => {
    if (!token.get()) {
      setCarregando(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => token.clear())
      .finally(() => setCarregando(false));
  }, []);

  const sair = useCallback(() => {
    token.clear();
    setUser(null);
    setTarefa('balcao');
  }, []);

  // Token de 1 dia: quando ele vence no meio do turno, a tela precisa avisar
  // e devolver ao login, em vez de falhar calada em toda ação.
  useEffect(() => {
    const onErro = (e: PromiseRejectionEvent) => {
      if (e.reason instanceof ApiError && e.reason.status === 401) sair();
    };
    window.addEventListener('unhandledrejection', onErro);
    return () => window.removeEventListener('unhandledrejection', onErro);
  }, [sair]);

  if (carregando) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <Carregando>Abrindo o {brand.surface}</Carregando>
      </main>
    );
  }

  if (!user) return <Login onEntrar={setUser} />;

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        background: 'var(--mid)',
      }}
    >
      <Cabecalho user={user} onSair={sair} />

      <div className="shell">
        <Trilho tarefa={tarefa} onTarefa={setTarefa} />

        <main style={{ minWidth: 0, padding: 'calc(var(--u) * 4)' }}>
          {tarefa === 'balcao' && <Balcao operador={user} />}
          {tarefa === 'acervo' && <Acervo />}
          {tarefa === 'emprestimos' && <Emprestimos />}
          {tarefa === 'reservas' && <Reservas />}
        </main>
      </div>

      <style>{`
        .shell {
          display: grid;
          grid-template-columns: 208px 1fr;
          gap: 0;
          align-items: start;
          /* Sem isto as linhas automáticas esticam para preencher o 1fr do pai
             e abrem um vão morto entre o trilho e o conteúdo no celular. */
          align-content: start;
        }
        @media (max-width: 860px) {
          .shell { grid-template-columns: 1fr; }
          .trilho {
            position: static !important;
            flex-direction: row !important;
            flex-wrap: wrap;
            padding-bottom: 0;
          }
          .trilho button { flex: 1 1 140px; }
        }
      `}</style>
    </div>
  );
}

function Cabecalho({ user, onSair }: { user: User; onSair: () => void }) {
  return (
    <header
      style={{
        background: 'var(--ink)',
        color: 'var(--pale)',
        borderBottom: 'var(--border) solid var(--ink)',
        display: 'flex',
        alignItems: 'center',
        gap: 'calc(var(--u) * 4)',
        padding: 'calc(var(--u) * 3) calc(var(--u) * 4)',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 2)' }}>
        <span className="dither" style={{ width: 22, height: 22, borderRadius: 3 }} aria-hidden />
        <span
          style={{
            fontFamily: 'var(--font-chrome)',
            fontSize: 18,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {brand.name}
        </span>
        <span className="label" style={{ color: 'var(--mid)', opacity: 1 }}>
          {brand.tagline}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <span className="label" style={{ color: 'var(--pale)', opacity: 1 }}>
        {user.name} · {user.role === 'ADMIN' ? 'direção' : 'balcão'}
      </span>
      <button
        onClick={onSair}
        style={{
          background: 'transparent',
          color: 'var(--pale)',
          border: '2px solid var(--pale)',
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
          fontFamily: 'var(--font-chrome)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <PixelIcon name="sair" size={11} />
        Sair
      </button>
    </header>
  );
}

function Trilho({ tarefa, onTarefa }: { tarefa: Tarefa; onTarefa: (t: Tarefa) => void }) {
  return (
    <nav
      className="trilho"
      aria-label="Tarefas do balcão"
      style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--u) * 2)',
        padding: 'calc(var(--u) * 4)',
        background: 'var(--mid)',
      }}
    >
      {TAREFAS.map((t) => {
        const ativo = t.id === tarefa;
        return (
          <button
            key={t.id}
            onClick={() => onTarefa(t.id)}
            aria-current={ativo ? 'page' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'calc(var(--u) * 2.5)',
              padding: 'calc(var(--u) * 2.5) calc(var(--u) * 3)',
              border: 'var(--border) solid var(--ink)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-chrome)',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              /* Ativo se marca por INVERSÃO — não por cor nova. */
              background: ativo ? 'var(--ink)' : 'var(--pale)',
              color: ativo ? 'var(--pale)' : 'var(--ink)',
              boxShadow: ativo ? 'none' : '0 3px 0 0 var(--shade)',
              transform: ativo ? 'translateY(3px)' : undefined,
            }}
          >
            <PixelIcon name={t.icon} size={14} />
            {t.nome}
          </button>
        );
      })}
    </nav>
  );
}

export { Btn };
