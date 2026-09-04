import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Copy, Loan, User } from '../api/types';
import { dia, plural, reais } from '../format';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Carregando, Carta, Contador, Recado, Selo, Vazio } from '../ui/kit';
import type { Tom } from '../ui/kit';

type Aviso = { tipo: 'ok' | 'trava' | 'aviso'; texto: string } | null;

/**
 * O atendimento. Um campo de comando, porque o funcionário tem o livro na mão
 * e o que ele sabe é o código de tombo. Tudo o mais nasce do exemplar que o
 * tombo acende: a tela oferece a única ação que aquele exemplar aceita agora.
 */
export function Balcao({ operador }: { operador: User }) {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [exemplar, setExemplar] = useState<Copy | null>(null);
  const [candidatos, setCandidatos] = useState<Copy[] | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [versao, setVersao] = useState(0);

  async function procurar(e?: React.FormEvent) {
    e?.preventDefault();
    const code = codigo.trim();
    if (!code) return;

    setBuscando(true);
    setAviso(null);
    setExemplar(null);
    setCandidatos(null);

    try {
      const r = await api.copies({ code, perPage: 8 });
      if (r.data.length === 0) {
        setAviso({ tipo: 'trava', texto: `Nenhum exemplar com o tombo “${code}”.` });
      } else if (r.data.length === 1) {
        await abrir(r.data[0]!.id);
      } else {
        setCandidatos(r.data);
      }
    } catch (err) {
      setAviso({ tipo: 'trava', texto: msg(err) });
    } finally {
      setBuscando(false);
    }
  }

  async function abrir(id: string) {
    setBuscando(true);
    try {
      setCandidatos(null);
      setExemplar(await api.copy(id));
    } catch (err) {
      setAviso({ tipo: 'trava', texto: msg(err) });
    } finally {
      setBuscando(false);
    }
  }

  function limpar() {
    setExemplar(null);
    setCandidatos(null);
    setCodigo('');
    setAviso(null);
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 6)' }}>
      <header>
        <h1>Atendimento</h1>
        <p className="sub" style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15, color: 'var(--tinta-campo)' }}>
          Leia o tombo do exemplar que está na sua mão.
        </p>
      </header>

      {/* Campo de comando: a coisa mais larga e mais alta da tela, porque é
          por onde todo atendimento começa. */}
      <form onSubmit={procurar} className="comando">
        <div style={{ flex: '1 1 320px' }}>
          <Campo
            id="tombo"
            label="Código de tombo"
            value={codigo}
            onChange={setCodigo}
            autoFocus
            grande
            icone="bipar"
            dica="Digite ou passe o leitor de código de barras. Ex.: 0884-001"
          />
        </div>
        <div style={{ display: 'flex', gap: 'calc(var(--u) * 2)', paddingTop: 26 }}>
          <Btn type="submit" variant="acao" icone="busca" loading={buscando}>
            Buscar
          </Btn>
          {(exemplar || candidatos) && (
            <Btn onClick={limpar} variant="fantasma">
              Limpar
            </Btn>
          )}
        </div>
      </form>

      {aviso ? (
        <Recado tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Recado>
      ) : null}

      {candidatos ? (
        <Carta titulo={`${candidatos.length} exemplares com esse código`} icone="acervo">
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }}>
            {candidatos.map((c) => (
              <button key={c.id} onClick={() => abrir(c.id)} className="toque linha-clicavel">
                <span className="cod">{c.code}</span>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{c.book?.title}</span>
                <SituacaoSelo status={c.status} />
                <span style={{ color: 'var(--tinta-3)' }}>
                  <Icon name="seta" size={16} />
                </span>
              </button>
            ))}
          </div>
        </Carta>
      ) : null}

      {exemplar ? (
        <Ficha
          exemplar={exemplar}
          operador={operador}
          onFeito={(texto) => {
            setAviso({ tipo: 'ok', texto });
            setVersao((v) => v + 1);
            void abrir(exemplar.id);
          }}
          onTrava={(texto) => setAviso({ tipo: 'trava', texto })}
        />
      ) : null}

      <EmCirculacao versao={versao} />

      <style>{`
        .comando {
          display: flex;
          gap: calc(var(--u) * 4);
          align-items: flex-start;
          flex-wrap: wrap;
          background: var(--papel);
          border: 1px solid var(--linha);
          border-radius: var(--r-g);
          padding: calc(var(--u) * 5);
          box-shadow: var(--sombra-2);
        }
        .linha-clicavel {
          display: flex; align-items: center; gap: calc(var(--u) * 3);
          width: 100%; padding: calc(var(--u) * 3) calc(var(--u) * 3.5);
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: var(--r); cursor: pointer; font: inherit;
          color: var(--tinta);
        }
        .linha-clicavel:hover { border-color: var(--acao); background: var(--acao-fraca); }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------- Ficha */

function Ficha({
  exemplar,
  operador,
  onFeito,
  onTrava,
}: {
  exemplar: Copy;
  operador: User;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const emprestimo = exemplar.loans?.[0];
  const disponivel = exemplar.status === 'AVAILABLE';
  const emprestado = exemplar.status === 'ON_LOAN';
  const reservado = exemplar.status === 'RESERVED';
  const fora = exemplar.status === 'MAINTENANCE' || exemplar.status === 'LOST';

  return (
    <div className="carta surge pulso" style={{ overflow: 'hidden' }}>
      <div className="ficha-topo">
        <div style={{ minWidth: 0 }}>
          <span className="cod" style={{ color: 'var(--tinta-3)' }}>
            {exemplar.code}
          </span>
          <h2 style={{ fontSize: 22, marginTop: 2 }}>{exemplar.book?.title}</h2>
          <p className="sub" style={{ margin: 'calc(var(--u) * 1) 0 0' }}>
            ISBN {exemplar.book?.isbn}
            {exemplar.shelf ? ` · estante ${exemplar.shelf}` : ''}
          </p>
        </div>
        <SituacaoSelo status={exemplar.status} />
      </div>

      <div style={{ padding: 'calc(var(--u) * 5)', display: 'grid', gap: 'calc(var(--u) * 5)' }}>
        {emprestado && emprestimo ? <ComQuemEsta emprestimo={emprestimo} /> : null}

        {fora ? (
          <Recado tipo="aviso">
            Exemplar fora de circulação (
            {exemplar.status === 'MAINTENANCE' ? 'em manutenção' : 'consta como perdido'}). Nada a
            fazer no balcão.
          </Recado>
        ) : null}

        {reservado ? (
          <Recado tipo="aviso">
            Separado para quem está na frente da fila. Só sai para essa pessoa — escolha o leitor e o
            servidor confere.
          </Recado>
        ) : null}

        {disponivel || reservado ? (
          <Emprestar exemplar={exemplar} operador={operador} onFeito={onFeito} onTrava={onTrava} />
        ) : null}

        {emprestado && emprestimo ? (
          <Devolver loanId={emprestimo.id} onFeito={onFeito} onTrava={onTrava} />
        ) : null}
      </div>

      <style>{`
        .ficha-topo {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: calc(var(--u) * 4);
          padding: calc(var(--u) * 5);
          background: linear-gradient(180deg, var(--acao-fraca), transparent);
          border-bottom: 1px solid var(--linha);
        }
      `}</style>
    </div>
  );
}

function ComQuemEsta({ emprestimo }: { emprestimo: { dueAt: string; user: { name: string } } }) {
  const atrasado = new Date(emprestimo.dueAt).getTime() < Date.now();
  const dias = Math.abs(Math.ceil((new Date(emprestimo.dueAt).getTime() - Date.now()) / 86_400_000));

  return (
    <div className="fatos">
      <Fato rotulo="Com o leitor" valor={emprestimo.user.name} />
      <Fato rotulo="Volta em" valor={dia(emprestimo.dueAt)} mono />
      <div>
        <span className="rotulo" style={{ display: 'block' }}>
          {atrasado ? 'Dias de atraso' : 'Dias restantes'}
        </span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: atrasado ? 'var(--trava)' : 'var(--tinta)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Contador value={dias} casas={2} cor={atrasado ? 'var(--trava)' : undefined} />
          {atrasado ? <Selo tom="trava" ponto>em atraso</Selo> : null}
        </span>
      </div>
      <style>{`
        .fatos {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: calc(var(--u) * 5);
          padding: calc(var(--u) * 4);
          background: var(--campo);
          border-radius: var(--r);
        }
      `}</style>
    </div>
  );
}

function Fato({ rotulo, valor, mono }: { rotulo: string; valor: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 0 }}>
      <span className="rotulo" style={{ display: 'block' }}>
        {rotulo}
      </span>
      <span
        style={{
          fontSize: mono ? 20 : 17,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          fontFamily: mono ? 'var(--mono)' : undefined,
        }}
      >
        {valor}
      </span>
    </div>
  );
}

/* --------------------------------------------------------------- Emprestar */

function Emprestar({
  exemplar,
  operador,
  onFeito,
  onTrava,
}: {
  exemplar: Copy;
  operador: User;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const [leitores, setLeitores] = useState<User[]>([]);
  const [leitor, setLeitor] = useState<User | null>(null);
  const [procurando, setProcurando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const termo = busca.trim();
    if (termo.length < 2) {
      setLeitores([]);
      return;
    }
    let vivo = true;
    setProcurando(true);
    const t = setTimeout(() => {
      api
        .users({ search: termo, role: 'MEMBER', perPage: 6 })
        .then((r) => vivo && setLeitores(r.data))
        .catch(() => vivo && setLeitores([]))
        .finally(() => vivo && setProcurando(false));
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [busca]);

  async function emprestar() {
    if (!leitor) return;
    setEnviando(true);
    try {
      const l = await api.createLoan(exemplar.id, leitor.id);
      onFeito(`Emprestado a ${l.user.name}. Volta em ${dia(l.dueAt)}.`);
      setLeitor(null);
      setBusca('');
    } catch (err) {
      // A regra é do servidor; a frase de recusa também. Não reescrevemos.
      onTrava(msg(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
      <Passo n={1} texto="Escolha o leitor" />

      {leitor ? (
        <div className="leitor-escolhido">
          <span className="avatar-lg" aria-hidden>
            <Icon name="usuario" size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block' }}>{leitor.name}</strong>
            <span className="sub">{leitor.email}</span>
          </span>
          <Btn variant="fantasma" size="sm" onClick={() => setLeitor(null)}>
            Trocar
          </Btn>
        </div>
      ) : (
        <>
          <Campo
            id="leitor"
            label="Leitor"
            value={busca}
            onChange={setBusca}
            icone="usuario"
            dica={procurando ? 'Procurando…' : 'Nome ou e-mail, ao menos 2 letras.'}
          />
          {leitores.length > 0 ? (
            <div style={{ display: 'grid', gap: 'calc(var(--u) * 1.5)' }}>
              {leitores.map((u) => (
                <button key={u.id} onClick={() => setLeitor(u)} className="toque linha-clicavel">
                  <span style={{ flex: 1, textAlign: 'left', fontWeight: 600 }}>{u.name}</span>
                  <span className="sub">{u.email}</span>
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      <Passo n={2} texto="Registre a saída" />
      <div>
        <Btn variant="acao" icone="emprestar" disabled={!leitor} loading={enviando} onClick={emprestar}>
          Emprestar{leitor ? ` a ${leitor.name.split(' ')[0]}` : ''}
        </Btn>
        <p className="sub" style={{ margin: 'calc(var(--u) * 2) 0 0' }}>
          Registrado por {operador.name}.
        </p>
      </div>

      <style>{`
        .leitor-escolhido {
          display: flex; align-items: center; gap: calc(var(--u) * 3);
          padding: calc(var(--u) * 3);
          background: var(--acao-fraca); border-radius: var(--r);
        }
        .avatar-lg {
          width: 38px; height: 38px; flex: none; border-radius: 50%;
          background-image: var(--gradiente-forte); color: #fff; display: grid; place-items: center;
        }
      `}</style>
    </div>
  );
}

function Passo({ n, texto }: { n: number; texto: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 2.5)' }}>
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          backgroundImage: 'var(--gradiente-forte)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 800,
          display: 'grid',
          placeItems: 'center',
          flex: 'none',
        }}
      >
        {n}
      </span>
      <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em' }}>{texto}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- Devolver */

function Devolver({
  loanId,
  onFeito,
  onTrava,
}: {
  loanId: string;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [devolvendo, setDevolvendo] = useState(false);
  const [renovando, setRenovando] = useState(false);

  async function devolver() {
    setDevolvendo(true);
    try {
      const l: Loan = await api.returnLoan(loanId);
      const multa =
        l.fine > 0
          ? ` Multa de ${reais(l.fine)} (${l.daysLate} ${plural(l.daysLate, 'dia', 'dias')} de atraso).`
          : ' Sem multa.';
      const fila = l.reservaAcionada ? ' O exemplar já foi separado para o próximo da fila.' : '';
      onFeito(`Devolução registrada.${multa}${fila}`);
    } catch (err) {
      onTrava(msg(err));
    } finally {
      setDevolvendo(false);
    }
  }

  async function renovar() {
    setRenovando(true);
    try {
      const l = await api.renewLoan(loanId);
      onFeito(`Renovado. Nova data de volta: ${dia(l.dueAt)}.`);
    } catch (err) {
      onTrava(msg(err));
    } finally {
      setRenovando(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 3)' }}>
      <Passo n={1} texto="Receba de volta" />
      <div style={{ display: 'flex', gap: 'calc(var(--u) * 3)', flexWrap: 'wrap' }}>
        <Btn variant="acao" icone="devolver" loading={devolvendo} onClick={devolver}>
          Registrar devolução
        </Btn>
        <Btn icone="reserva" loading={renovando} onClick={renovar}>
          Renovar prazo
        </Btn>
      </div>
      <p className="sub" style={{ margin: 0 }}>
        A multa é calculada pelo servidor no momento da devolução.
      </p>
    </div>
  );
}

/* --------------------------------------------------------- Em circulação -- */

function EmCirculacao({ versao }: { versao: number }) {
  const [loans, setLoans] = useState<Loan[] | null>(null);

  useEffect(() => {
    let vivo = true;
    api
      .loans({ status: 'ACTIVE', perPage: 8 })
      .then((r) => vivo && setLoans(r.data))
      .catch(() => vivo && setLoans([]));
    return () => {
      vivo = false;
    };
  }, [versao]);

  return (
    <Carta
      titulo="Fora da estante agora"
      icone="pilha"
      padding={false}
      direita={
        loans ? (
          <Selo tom={loans.some((l) => l.isOverdue) ? 'alerta' : 'neutro'}>
            {loans.length} {plural(loans.length, 'exemplar', 'exemplares')}
          </Selo>
        ) : null
      }
    >
      {loans === null ? (
        <div style={{ padding: 'calc(var(--u) * 5)' }}>
          <Carregando linhas={3} />
        </div>
      ) : loans.length === 0 ? (
        <Vazio icone="estante">Todo o acervo está na estante. Nenhum empréstimo em curso.</Vazio>
      ) : (
        <ul className="lista">
          {[...loans]
            .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue))
            .map((l) => (
              <li key={l.id} className="lista-linha">
                <span className="cod" style={{ color: 'var(--tinta-3)', width: 88 }}>
                  {l.copy.code}
                </span>
                <span style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: 14.5, letterSpacing: '-0.01em' }}>
                    {l.copy.book.title}
                  </strong>
                  <span className="sub">{l.user.name}</span>
                </span>
                <span className="sub num" style={{ minWidth: 88 }}>
                  {dia(l.dueAt)}
                </span>
                {l.isOverdue ? (
                  <Selo tom="trava" ponto>
                    {l.daysLate} {plural(l.daysLate, 'dia', 'dias')}
                  </Selo>
                ) : (
                  <Selo tom="ok">no prazo</Selo>
                )}
              </li>
            ))}
        </ul>
      )}

      <style>{`
        .lista { list-style: none; margin: 0; padding: 0; }
        .lista-linha {
          display: flex; align-items: center; gap: calc(var(--u) * 4);
          padding: calc(var(--u) * 3.5) calc(var(--u) * 5);
          border-bottom: 1px solid var(--linha);
          flex-wrap: wrap;
          transition: background-color 0.14s ease;
        }
        .lista-linha:last-child { border-bottom: 0; }
        .lista-linha:hover { background: var(--campo); }
      `}</style>
    </Carta>
  );
}

/* -------------------------------------------------------------------- util */

export function SituacaoSelo({ status }: { status: Copy['status'] }) {
  const mapa: Record<Copy['status'], { texto: string; tom: Tom }> = {
    AVAILABLE: { texto: 'na estante', tom: 'ok' },
    ON_LOAN: { texto: 'emprestado', tom: 'neutro' },
    RESERVED: { texto: 'separado', tom: 'espera' },
    MAINTENANCE: { texto: 'em manutenção', tom: 'alerta' },
    LOST: { texto: 'perdido', tom: 'trava' },
  };
  const m = mapa[status];
  return (
    <Selo tom={m.tom} ponto>
      {m.texto}
    </Selo>
  );
}

export function msg(err: unknown) {
  return err instanceof ApiError ? err.message : 'Erro inesperado. Tente de novo.';
}
