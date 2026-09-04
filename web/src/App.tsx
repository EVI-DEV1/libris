import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, token } from './api/client';
import type { Role, User } from './api/types';
import { brand } from './brand';
import { Icon } from './ui/Icon';
import type { IconName } from './ui/Icon';
import { Carregando } from './ui/kit';
import { Login } from './screens/Login';
import { Balcao } from './screens/Balcao';
import { Acervo } from './screens/Acervo';
import { Emprestimos } from './screens/Emprestimos';
import { Reservas } from './screens/Reservas';
import { Gestao } from './screens/Gestao';
import { Equipe } from './screens/Equipe';
import { TrocarSenha } from './screens/TrocarSenha';
import { portaAtual } from './rota';

type Tarefa = 'balcao' | 'acervo' | 'emprestimos' | 'reservas' | 'gestao' | 'equipe';

/** `gestao` fica atrás de papel: o leitor nem vê, e o servidor recusaria. */
const TAREFAS: { id: Tarefa; nome: string; icone: IconName; papeis?: Role[] }[] = [
  { id: 'balcao', nome: 'Atendimento', icone: 'bipar' },
  { id: 'acervo', nome: 'Acervo', icone: 'acervo' },
  { id: 'emprestimos', nome: 'Empréstimos', icone: 'pilha' },
  { id: 'reservas', nome: 'Reservas', icone: 'reserva' },
  { id: 'gestao', nome: 'Gestão', icone: 'estante', papeis: ['ADMIN', 'LIBRARIAN'] },
  { id: 'equipe', nome: 'Equipe', icone: 'chave', papeis: ['ADMIN'] },
];

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tarefa, setTarefa] = useState<Tarefa>('balcao');
  const [porta, setPorta] = useState(portaAtual);

  // As duas portas sao URLs de verdade: voltar no navegador tem que funcionar.
  useEffect(() => {
    const aoVoltar = () => setPorta(portaAtual());
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

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

  /** Direcao entrando pela porta dela cai direto na gestao, nao no balcao. */
  const entrou = useCallback(
    (u: User) => {
      setUser(u);
      if (portaAtual() === 'direcao' && u.role === 'ADMIN' && !u.mustChangePassword) {
        setTarefa('gestao');
      }
    },
    [],
  );

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
        <div style={{ width: 'min(420px, 90vw)' }}>
          <Carregando linhas={2} />
        </div>
      </main>
    );
  }

  if (!user) return <Login porta={porta} onEntrar={entrou} />;

  // Trava de primeiro acesso: senha padrao nao passa daqui.
  if (user.mustChangePassword) return <TrocarSenha user={user} onTrocada={setUser} />;

  return (
    <div className="app">
      <Trilho tarefa={tarefa} onTarefa={setTarefa} user={user} onSair={sair} />

      <main className="palco">
        <div className="palco-interno surge" key={tarefa}>
          {tarefa === 'balcao' && <Balcao operador={user} />}
          {tarefa === 'acervo' && <Acervo />}
          {tarefa === 'emprestimos' && <Emprestimos />}
          {tarefa === 'reservas' && <Reservas />}
          {tarefa === 'gestao' && <Gestao />}
          {tarefa === 'equipe' && <Equipe eu={user} />}
        </div>
      </main>

      <style>{`
        .app {
          min-height: 100dvh;
          display: grid;
          grid-template-columns: 248px 1fr;
          background: var(--fundo);
          background-attachment: fixed;
        }
        .app > * { min-width: 0; }
        .palco { min-width: 0; overflow-x: hidden; }
        .palco-interno {
          padding: calc(var(--u) * 8) calc(var(--u) * 8) calc(var(--u) * 14);
          max-width: 1180px;
        }
        @media (max-width: 980px) {
          .app { grid-template-columns: 1fr; }
          .palco-interno { padding: calc(var(--u) * 5) calc(var(--u) * 4) calc(var(--u) * 12); }
        }
      `}</style>
    </div>
  );
}

function Trilho({
  tarefa,
  onTarefa,
  user,
  onSair,
}: {
  tarefa: Tarefa;
  onTarefa: (t: Tarefa) => void;
  user: User;
  onSair: () => void;
}) {
  return (
    <nav className="trilho" aria-label="Áreas do sistema">
      <div className="marca">
        <span className="marca-selo" aria-hidden>
          <Icon name="acervo" size={19} />
        </span>
        <span style={{ minWidth: 0 }}>
          <strong style={{ display: 'block', fontSize: 17, letterSpacing: '-0.02em' }}>
            {brand.name}
          </strong>
          <span className="sub" style={{ fontSize: 12 }}>
            {brand.tagline}
          </span>
        </span>
      </div>

      <div className="trilho-itens">
        {TAREFAS.filter((t) => !t.papeis || t.papeis.includes(user.role)).map((t) => {
          const ativo = t.id === tarefa;
          return (
            <button
              key={t.id}
              onClick={() => onTarefa(t.id)}
              aria-current={ativo ? 'page' : undefined}
              className={`toque item ${ativo ? 'item-ativo' : ''}`}
            >
              <Icon name={t.icone} size={18} />
              {t.nome}
            </button>
          );
        })}
      </div>

      <div className="trilho-pe">
        <span className="quem">
          <span className="avatar" aria-hidden>
            <Icon name="usuario" size={16} />
          </span>
          <span style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: 13.5, letterSpacing: '-0.01em' }}>
              {user.name}
            </strong>
            <span className="sub" style={{ fontSize: 12 }}>
              {user.role === 'ADMIN' ? 'Direção' : 'Balcão'}
            </span>
          </span>
        </span>
        <button onClick={onSair} className="toque sair" aria-label="Sair da conta">
          <Icon name="sair" size={16} />
        </button>
      </div>

      <style>{`
        .trilho {
          display: flex;
          flex-direction: column;
          gap: calc(var(--u) * 6);
          padding: calc(var(--u) * 6) calc(var(--u) * 4);
          background: var(--papel);
          border-right: 1px solid var(--linha);
          position: sticky;
          top: 0;
          height: 100dvh;
        }
        .marca {
          display: flex;
          align-items: center;
          gap: calc(var(--u) * 3);
          padding: 0 calc(var(--u) * 2);
        }
        .marca-selo {
          width: 38px; height: 38px; flex: none;
          border-radius: 11px;
          background-image: var(--gradiente-forte);
          color: #fff;
          display: grid; place-items: center;
          box-shadow: var(--sombra-acao);
        }
        .trilho-itens { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .item {
          display: flex; align-items: center; gap: calc(var(--u) * 3);
          padding: calc(var(--u) * 2.75) calc(var(--u) * 3);
          border: 0; border-radius: var(--r);
          background: transparent; color: var(--tinta-2);
          font: inherit; font-size: 14px; font-weight: 600;
          letter-spacing: -0.01em;
          cursor: pointer; text-align: left;
        }
        .item:hover { background: var(--campo); color: var(--tinta); }
        /* O ativo ocupa um campo inteiro do ciano do gradiente, com a barra da
           cor cheia na borda: estado por região, não por marquinha. */
        .item-ativo,
        .item-ativo:hover {
          background: var(--acao-fraca);
          color: var(--acao-tinta);
          box-shadow: inset 3px 0 0 var(--g-a-forte);
        }
        .trilho-pe {
          display: flex; align-items: center; gap: calc(var(--u) * 2);
          padding: calc(var(--u) * 3) calc(var(--u) * 2) 0;
          border-top: 1px solid var(--linha);
        }
        .quem { display: flex; align-items: center; gap: calc(var(--u) * 2.5); flex: 1; min-width: 0; }
        .avatar {
          width: 32px; height: 32px; flex: none; border-radius: 50%;
          background: var(--campo-2); color: var(--tinta-2);
          display: grid; place-items: center;
        }
        .sair {
          background: transparent; border: 0; cursor: pointer;
          color: var(--tinta-3); padding: calc(var(--u) * 2);
          border-radius: var(--r); display: inline-flex;
        }
        .sair:hover { background: var(--trava-fraca); color: var(--trava); }

        @media (max-width: 980px) {
          .trilho {
            position: static; height: auto;
            border-right: 0; border-bottom: 1px solid var(--linha);
            flex-direction: row; align-items: center; flex-wrap: wrap;
            gap: calc(var(--u) * 3);
            padding: calc(var(--u) * 3) calc(var(--u) * 4);
            max-width: 100%;
          }
          .trilho-itens {
            flex-direction: row; flex: 1 1 100%; order: 3;
            overflow-x: auto; gap: calc(var(--u) * 1);
            scrollbar-width: none;
            /* Sem isto o strip rolável cresce até a largura do conteúdo (505px)
               e empurra a página inteira: min-width de flex item é auto. */
            min-width: 0;
          }
          .trilho-itens::-webkit-scrollbar { display: none; }
          .item { white-space: nowrap; }
          .item-ativo, .item-ativo:hover { box-shadow: inset 0 -3px 0 var(--g-a-forte); }
          .trilho-pe { border-top: 0; padding: 0; flex: none; }
          .quem .sub { display: none; }
        }
      `}</style>
    </nav>
  );
}
