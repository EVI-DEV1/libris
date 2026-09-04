import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Role, User } from '../api/types';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Carregando, Carta, Recado, Selo, Vazio } from '../ui/kit';
import { msg } from './Balcao';

type Aviso = { tipo: 'ok' | 'trava' | 'aviso'; texto: string } | null;

/**
 * Equipe: só a direção entra aqui, e só a direção cria conta.
 *
 * A senha nunca é escolhida por quem cria — sai sempre a padrão da casa, com
 * troca obrigatória no primeiro acesso. É também o caminho de "esqueci a
 * senha": resetar devolve a conta para a padrão e liga a trava de novo.
 */
export function Equipe({ eu }: { eu: User }) {
  const [pessoas, setPessoas] = useState<User[] | null>(null);
  const [busca, setBusca] = useState('');
  const [aviso, setAviso] = useState<Aviso>(null);
  const [versao, setVersao] = useState(0);

  const carregar = useCallback(() => {
    setPessoas(null);
    Promise.all([
      api.users({ role: 'ADMIN', perPage: 50, search: busca.trim() || undefined }),
      api.users({ role: 'LIBRARIAN', perPage: 50, search: busca.trim() || undefined }),
    ])
      .then(([a, l]) => setPessoas([...a.data, ...l.data]))
      .catch((e) => {
        setPessoas([]);
        setAviso({ tipo: 'trava', texto: msg(e) });
      });
  }, [busca]);

  useEffect(carregar, [carregar, versao]);

  async function resetar(p: User) {
    try {
      await api.resetarSenha(p.id);
      setAviso({
        tipo: 'ok',
        texto: `A senha de ${p.name} voltou para a padrão da casa. Avise a pessoa: no próximo acesso o sistema pede uma senha nova.`,
      });
      setVersao((v) => v + 1);
    } catch (e) {
      setAviso({ tipo: 'trava', texto: msg(e) });
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 6)' }}>
      <header>
        <h1>Equipe</h1>
        <p
          className="sub"
          style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15, color: 'var(--tinta-campo)' }}
        >
          Quem tem acesso ao sistema. A conta nasce com a senha padrão da casa e o sistema
          obriga a pessoa a trocar no primeiro acesso.
        </p>
      </header>

      {aviso ? (
        <Recado tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Recado>
      ) : null}

      <NovoFuncionario
        onFeito={(t) => {
          setAviso({ tipo: 'ok', texto: t });
          setVersao((v) => v + 1);
        }}
        onTrava={(t) => setAviso({ tipo: 'trava', texto: t })}
      />

      <Carta>
        <Campo
          id="equipe-busca"
          label="Achar pessoa"
          value={busca}
          onChange={setBusca}
          icone="busca"
          dica="Nome ou e-mail."
        />
      </Carta>

      <Carta
        titulo="Com acesso ao sistema"
        icone="usuario"
        padding={false}
        direita={pessoas ? <Selo>{pessoas.length}</Selo> : null}
      >
        {pessoas === null ? (
          <div style={{ padding: 'calc(var(--u) * 5)' }}>
            <Carregando linhas={3} />
          </div>
        ) : pessoas.length === 0 ? (
          <Vazio icone="usuario">Ninguém encontrado com esse termo.</Vazio>
        ) : (
          <ul className="lista">
            {pessoas.map((p) => (
              <li key={p.id} className="pessoa">
                <span className="retrato" aria-hidden>
                  <Icon name={p.role === 'ADMIN' ? 'chave' : 'usuario'} size={16} />
                </span>

                <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 14.5, letterSpacing: '-0.01em' }}>
                    {p.name}
                    {p.id === eu.id ? <span className="voce">você</span> : null}
                  </strong>
                  <span className="sub">{p.email}</span>
                </span>

                <Selo tom={p.role === 'ADMIN' ? 'espera' : 'neutro'}>
                  {p.role === 'ADMIN' ? 'Direção' : 'Funcionário'}
                </Selo>

                {p.mustChangePassword ? (
                  <Selo tom="alerta" ponto>
                    senha padrão
                  </Selo>
                ) : null}

                {p.active === false ? <Selo tom="trava">inativo</Selo> : null}

                {p.id === eu.id ? (
                  <span className="sub">sua conta</span>
                ) : (
                  <Btn size="sm" icone="chave" onClick={() => resetar(p)}>
                    Resetar senha
                  </Btn>
                )}
              </li>
            ))}
          </ul>
        )}
      </Carta>

      <style>{`
        .lista { list-style: none; margin: 0; padding: 0; }
        .pessoa {
          display: flex; align-items: center; gap: calc(var(--u) * 3.5);
          padding: calc(var(--u) * 3.5) calc(var(--u) * 5);
          border-bottom: 1px solid var(--linha); flex-wrap: wrap;
          transition: background-color 0.14s ease;
        }
        .pessoa:last-child { border-bottom: 0; }
        .pessoa:hover { background: var(--campo); }
        .retrato {
          width: 34px; height: 34px; flex: none; border-radius: 50%;
          background: var(--campo-2); color: var(--tinta-2);
          display: grid; place-items: center;
        }
        .voce {
          margin-left: 8px; font-size: 11.5px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--acao-tinta); background: var(--acao-fraca);
          padding: 2px 7px; border-radius: 999px;
        }
      `}</style>
    </div>
  );
}

function NovoFuncionario({
  onFeito,
  onTrava,
}: {
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<Extract<Role, 'ADMIN' | 'LIBRARIAN'>>('LIBRARIAN');
  const [enviando, setEnviando] = useState(false);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const u = await api.criarFuncionario({ name: nome.trim(), email: email.trim(), role: papel });
      onFeito(
        `Conta de ${u.name} criada. Passe a senha padrão da casa para a pessoa — no primeiro acesso o sistema pede uma nova.`,
      );
      setNome('');
      setEmail('');
      setPapel('LIBRARIAN');
    } catch (err) {
      onTrava(msg(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={criar}>
      <Carta titulo="Dar acesso a alguém" icone="usuario">
        <div style={{ display: 'grid', gap: 'calc(var(--u) * 5)' }}>
          <div className="dupla">
            <Campo id="func-nome" label="Nome" value={nome} onChange={setNome} />
            <Campo id="func-email" label="E-mail" type="email" value={email} onChange={setEmail} />
          </div>

          <div>
            <span className="rotulo" style={{ display: 'block', marginBottom: 'calc(var(--u) * 2)' }}>
              Papel
            </span>
            <div className="papeis">
              <Papel
                ativo={papel === 'LIBRARIAN'}
                onClick={() => setPapel('LIBRARIAN')}
                icone="bipar"
                titulo="Funcionário"
                texto="Atende no balcão, empresta, devolve e cuida do acervo."
              />
              <Papel
                ativo={papel === 'ADMIN'}
                onClick={() => setPapel('ADMIN')}
                icone="chave"
                titulo="Direção"
                texto="Tudo do funcionário, mais criar contas e resetar senhas."
              />
            </div>
          </div>

          <div>
            <Btn type="submit" variant="acao" icone="check" loading={enviando}>
              Criar acesso
            </Btn>
            <p className="sub" style={{ margin: 'calc(var(--u) * 2) 0 0' }}>
              A senha sai sempre a padrão da casa. Ninguém escolhe a senha de outra pessoa.
            </p>
          </div>
        </div>
      </Carta>

      <style>{`
        .dupla {
          display: grid; gap: calc(var(--u) * 4);
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .papeis {
          display: grid; gap: calc(var(--u) * 3);
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
      `}</style>
    </form>
  );
}

function Papel({
  ativo,
  onClick,
  icone,
  titulo,
  texto,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: 'bipar' | 'chave';
  titulo: string;
  texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`toque papel ${ativo ? 'papel-ativo' : ''}`}
    >
      <span className="papel-icone">
        <Icon name={icone} size={18} />
      </span>
      <span style={{ textAlign: 'left' }}>
        <strong style={{ display: 'block', fontSize: 14.5 }}>{titulo}</strong>
        <span className="sub" style={{ fontSize: 13 }}>
          {texto}
        </span>
      </span>

      <style>{`
        .papel {
          display: flex; align-items: flex-start; gap: calc(var(--u) * 3);
          padding: calc(var(--u) * 3.5);
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: var(--r); cursor: pointer; font: inherit;
          color: var(--tinta); text-align: left; width: 100%;
        }
        .papel:hover { border-color: var(--acao); }
        .papel-ativo {
          border-color: var(--acao); background: var(--acao-fraca);
          box-shadow: 0 0 0 3px rgba(22, 191, 253, 0.18);
        }
        .papel-icone {
          width: 34px; height: 34px; flex: none; border-radius: 9px;
          background: var(--campo-2); color: var(--tinta-2);
          display: grid; place-items: center;
        }
        .papel-ativo .papel-icone {
          background-image: var(--gradiente-forte); color: #fff;
        }
      `}</style>
    </button>
  );
}
