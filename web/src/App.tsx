import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, token } from './api/client';
import type { User } from './api/types';
import { brand } from './brand';
import { PixelIcon } from './ui/PixelIcon';
import type { IconName } from './ui/PixelIcon';
import { Carregando } from './ui/kit';
import { Login } from './screens/Login';
import { Balcao } from './screens/Balcao';
import { Acervo } from './screens/Acervo';
import { Emprestimos } from './screens/Emprestimos';
import { Reservas } from './screens/Reservas';

type Tarefa = 'balcao' | 'acervo' | 'emprestimos' | 'reservas';

const TAREFAS: { id: Tarefa; nome: string; icon: IconName }[] = [
  { id: 'balcao', nome: 'Balcão', icon: 'balcao' },
  { id: 'acervo', nome: 'Acervo', icon: 'acervo' },
  { id: 'emprestimos', nome: 'Empréstimos', icon: 'pilha' },
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
    /* Moldura fixa: o aparelho em volta da tela. Borda grossa de tinta e uma
       regra clara por dentro — a segunda linha que este mundo desenha em toda
       placa. Sem ela, o conteúdo flutuava solto num campo sem limite. */
    <div className="moldura aparelho">
      <Cabecalho user={user} onSair={sair} />

      <div className="shell dither-fine">
        <Trilho tarefa={tarefa} onTarefa={setTarefa} />

        <main style={{ minWidth: 0, padding: 'calc(var(--u) * 4)', display: 'flex' }}>
          {tarefa === 'balcao' && <Balcao operador={user} />}
          {tarefa === 'acervo' && <Acervo />}
          {tarefa === 'emprestimos' && <Emprestimos />}
          {tarefa === 'reservas' && <Reservas />}
        </main>
      </div>

      <style>{`
        .aparelho {
          height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr;
          background: var(--mid);
          overflow: hidden;
        }
        .shell {
          display: grid;
          grid-template-columns: 208px 1fr;
          background-color: var(--mid);
          min-height: 0;
          overflow-y: auto;
        }
        /* A tela de tarefa ocupa a altura que sobra: nada de conteúdo
           flutuando sobre meio viewport de campo vazio. */
        .shell > main > * { flex: 1; min-width: 0; }
        @media (max-width: 860px) {
          .shell {
            grid-template-columns: 1fr;
            /* Linhas declaradas em vez de align-content: start. Com as duas
               automaticas elas esticavam igual e abriam um vao morto; com
               start elas encolhiam e a lista nao ocupava a sobra. */
            grid-template-rows: auto 1fr;
          }
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
        display: 'flex',
        alignItems: 'center',
        gap: 'calc(var(--u) * 4)',
        padding: 'calc(var(--u) * 3) calc(var(--u) * 4)',
        flexWrap: 'wrap',
        /* Faixa de xadrez fechando a barra, como o terminador de cabeçalho
           deste mundo. Fica sob a borda, nunca sob letra. */
        borderBottom: '8px solid transparent',
        borderImage:
          'repeating-linear-gradient(45deg, var(--shade) 0 4px, var(--ink) 4px 8px) 8',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 2)' }}>
        <span className="dither" style={{ width: 24, height: 24, borderRadius: 3 }} aria-hidden />
        <span
          style={{
            fontFamily: 'var(--font-chrome)',
            fontSize: 20,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {brand.name}
        </span>
        <span className="label" style={{ color: 'var(--mid)' }}>
          {brand.tagline}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <span className="dado" style={{ color: 'var(--pale)' }}>
        {user.name} · {user.role === 'ADMIN' ? 'direção' : 'balcão'}
      </span>
      <button
        onClick={onSair}
        className="bloco"
        style={{
          background: 'transparent',
          color: 'var(--pale)',
          border: '2px solid var(--pale)',
          borderRadius: 4,
          padding: 'calc(var(--u) * 1.5) calc(var(--u) * 2.5)',
          cursor: 'pointer',
          fontFamily: 'var(--font-chrome)',
          fontSize: 'var(--t-chrome)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <PixelIcon name="sair" size={12} />
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
        alignSelf: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--u) * 2)',
        padding: 'calc(var(--u) * 4)',
      }}
    >
      {TAREFAS.map((t) => {
        const ativo = t.id === tarefa;
        return (
          <button
            key={t.id}
            onClick={() => onTarefa(t.id)}
            aria-current={ativo ? 'page' : undefined}
            className="bloco"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'calc(var(--u) * 2.5)',
              padding: 'calc(var(--u) * 3)',
              border: 'var(--border) solid var(--ink)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'var(--font-chrome)',
              fontSize: 'var(--t-chrome)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              /* Ativo se marca por INVERSÃO — não por cor nova. */
              background: ativo ? 'var(--ink)' : 'var(--pale)',
              color: ativo ? 'var(--pale)' : 'var(--ink)',
              boxShadow: ativo
                ? 'none'
                : '0 3px 0 0 var(--shade), 0 5px 8px -4px rgba(15, 56, 15, 0.4)',
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
