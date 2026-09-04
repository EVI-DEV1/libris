import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Copy, Loan, User } from '../api/types';
import { dia, plural, reais } from '../format';
import { PixelIcon } from '../ui/PixelIcon';
import { Btn, Carregando, Counter, Field, Lamp, Proximo, Recado, Tag, Vazio, Win } from '../ui/kit';

type Recado = { kind: 'ok' | 'bloqueio' | 'aviso'; texto: string } | null;

/**
 * O balcão. Um campo de comando, porque o funcionário tem o livro na mão e o
 * que ele sabe é o código de tombo. Tudo o mais nasce da linha que o tombo
 * acende: a tela oferece a única ação que aquele exemplar aceita agora.
 */
export function Balcao({ operador }: { operador: User }) {
  const [codigo, setCodigo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [exemplar, setExemplar] = useState<Copy | null>(null);
  const [candidatos, setCandidatos] = useState<Copy[] | null>(null);
  const [recado, setRecado] = useState<Recado>(null);
  // Cada acao concluida no balcao envelhece o quadro: este contador o refaz.
  const [versao, setVersao] = useState(0);
  const campo = useRef<HTMLDivElement>(null);

  async function procurar(e?: React.FormEvent) {
    e?.preventDefault();
    const code = codigo.trim();
    if (!code) return;

    setBuscando(true);
    setRecado(null);
    setExemplar(null);
    setCandidatos(null);

    try {
      const r = await api.copies({ code, perPage: 8 });
      if (r.data.length === 0) {
        setRecado({ kind: 'bloqueio', texto: `Nenhum exemplar com o tombo “${code}”.` });
      } else if (r.data.length === 1) {
        await abrir(r.data[0]!.id);
      } else {
        setCandidatos(r.data);
      }
    } catch (err) {
      setRecado({ kind: 'bloqueio', texto: msg(err) });
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
      setRecado({ kind: 'bloqueio', texto: msg(err) });
    } finally {
      setBuscando(false);
    }
  }

  function limpar() {
    setExemplar(null);
    setCandidatos(null);
    setCodigo('');
    setRecado(null);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--u) * 4)',
        maxWidth: 1100,
        width: '100%',
      }}
    >
      {/* ---- Caixa de comando: o cursor piscando é o começo de tudo ---- */}
      <form onSubmit={procurar} className="win" style={{ padding: 'calc(var(--u) * 4)' }}>
        <div
          style={{
            display: 'flex',
            gap: 'calc(var(--u) * 3)',
            // 'center' e nao 'flex-end': a dica embaixo do campo empurrava o
            // botao 30px abaixo do input a que ele pertence.
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 260px' }}>
            <Field
              id="tombo"
              label="Bipe ou digite o tombo"
              value={codigo}
              onChange={setCodigo}
              exemplo="0884-001"
              autoFocus
              hint="o código está na etiqueta da lombada"
            />
          </div>
          <Btn type="submit" variant="primary" icon="busca" loading={buscando}>
            Puxar exemplar
          </Btn>
          {(exemplar || candidatos) && (
            <Btn onClick={limpar} icon="x">
              Limpar
            </Btn>
          )}
        </div>
      </form>

      {recado ? (
        <Recado kind={recado.kind} onClose={() => setRecado(null)}>
          {recado.texto}
        </Recado>
      ) : null}

      {candidatos ? (
        <Win title={`${candidatos.length} exemplares batem com esse código`} icon="acervo">
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }}>
            {candidatos.map((c) => (
              <button
                key={c.id}
                onClick={() => abrir(c.id)}
                className="win-flat"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'calc(var(--u) * 3)',
                  padding: 'calc(var(--u) * 3)',
                  cursor: 'pointer',
                  font: 'inherit',
                  textAlign: 'left',
                  color: 'inherit',
                }}
              >
                <strong style={{ fontFamily: 'var(--font-chrome)', fontSize: 13 }}>{c.code}</strong>
                <span style={{ flex: 1 }}>{c.book?.title}</span>
                <SituacaoTag status={c.status} />
                <Proximo />
              </button>
            ))}
          </div>
        </Win>
      ) : null}

      {exemplar ? (
        <div ref={campo}>
          <FichaDoExemplar
            exemplar={exemplar}
            operador={operador}
            onFeito={(texto) => {
              setRecado({ kind: 'ok', texto });
              setVersao((v) => v + 1);
              void abrir(exemplar.id);
            }}
            onBloqueio={(texto) => setRecado({ kind: 'bloqueio', texto })}
          />
        </div>
      ) : null}

      <OCampo versao={versao} />
    </div>
  );
}

/* ------------------------------------------------------------------ Ficha */

function FichaDoExemplar({
  exemplar,
  operador,
  onFeito,
  onBloqueio,
}: {
  exemplar: Copy;
  operador: User;
  onFeito: (texto: string) => void;
  onBloqueio: (texto: string) => void;
}) {
  const emprestimo = exemplar.loans?.[0];
  const disponivel = exemplar.status === 'AVAILABLE';
  const emprestado = exemplar.status === 'ON_LOAN';
  const reservado = exemplar.status === 'RESERVED';
  const fora = exemplar.status === 'MAINTENANCE' || exemplar.status === 'LOST';

  return (
    <Win
      title={`Tombo ${exemplar.code}`}
      icon="acervo"
      right={<SituacaoTag status={exemplar.status} onDark />}
    >
      <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
        <div>
          <h2 style={{ marginBottom: 'calc(var(--u) * 1)' }}>{exemplar.book?.title}</h2>
          <p className="dado" style={{ margin: 0 }}>
            ISBN {exemplar.book?.isbn}
            {exemplar.shelf ? ` · estante ${exemplar.shelf}` : ''}
          </p>
        </div>

        {emprestado && emprestimo ? (
          <ComQuemEsta emprestimo={emprestimo} />
        ) : null}

        {fora ? (
          <Recado kind="aviso">
            Este exemplar está fora de circulação (
            {exemplar.status === 'MAINTENANCE' ? 'em manutenção' : 'consta como perdido'}). Nada a
            fazer no balcão.
          </Recado>
        ) : null}

        {reservado ? (
          <Recado kind="aviso">
            Exemplar separado no balcão para quem está na frente da fila. Só sai para essa pessoa —
            escolha o leitor abaixo e o servidor confere.
          </Recado>
        ) : null}

        {disponivel || reservado ? (
          <Emprestar exemplar={exemplar} operador={operador} onFeito={onFeito} onBloqueio={onBloqueio} />
        ) : null}

        {emprestado && emprestimo ? (
          <Devolver loanId={emprestimo.id} onFeito={onFeito} onBloqueio={onBloqueio} />
        ) : null}
      </div>
    </Win>
  );
}

function ComQuemEsta({ emprestimo }: { emprestimo: { dueAt: string; user: { name: string } } }) {
  const atrasado = new Date(emprestimo.dueAt).getTime() < Date.now();
  const dias = Math.abs(Math.ceil((new Date(emprestimo.dueAt).getTime() - Date.now()) / 86_400_000));

  return (
    <div
      className="win-flat"
      style={{
        padding: 'calc(var(--u) * 3)',
        borderColor: atrasado ? 'var(--lamp)' : 'var(--ink)',
        display: 'flex',
        gap: 'calc(var(--u) * 5)',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <div>
        <span className="label" style={{ display: 'block' }}>
          Com
        </span>
        <strong>{emprestimo.user.name}</strong>
      </div>
      <div>
        <span className="label" style={{ display: 'block' }}>
          Volta em
        </span>
        <strong className="num">{dia(emprestimo.dueAt)}</strong>
      </div>
      <div>
        <span className="label" style={{ display: 'block' }}>
          {atrasado ? 'Dias de atraso' : 'Dias restantes'}
        </span>
        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Counter value={dias} places={2} />
          {atrasado ? <Lamp label="Em atraso" /> : null}
        </strong>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- Emprestar */

function Emprestar({
  exemplar,
  operador,
  onFeito,
  onBloqueio,
}: {
  exemplar: Copy;
  operador: User;
  onFeito: (t: string) => void;
  onBloqueio: (t: string) => void;
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
      onFeito(
        `Emprestado a ${l.user.name}. Volta em ${dia(l.dueAt)}.`,
      );
      setLeitor(null);
      setBusca('');
    } catch (err) {
      // A regra é do servidor; a frase de recusa também. Não reescrevemos.
      onBloqueio(msg(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 2)' }}>
        <Proximo />
        <span className="label">Próximo passo · escolha o leitor</span>
      </div>

      {leitor ? (
        <div
          className="win-flat inv"
          style={{
            padding: 'calc(var(--u) * 3)',
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--u) * 3)',
          }}
        >
          <PixelIcon name="check" size={14} />
          <div style={{ flex: 1 }}>
            <strong>{leitor.name}</strong>
            <span className="dado" style={{ display: 'block', color: 'var(--mid)' }}>
              {leitor.email}
            </span>
          </div>
          <button
            onClick={() => setLeitor(null)}
            aria-label="Trocar leitor"
            style={{
              background: 'transparent',
              border: '2px solid var(--pale)',
              color: 'var(--pale)',
              borderRadius: 4,
              padding: 4,
              cursor: 'pointer',
            }}
          >
            <PixelIcon name="x" size={11} />
          </button>
        </div>
      ) : (
        <>
          <Field
            id="leitor"
            label="Leitor"
            value={busca}
            onChange={setBusca}
            hint={procurando ? 'Procurando…' : 'Nome ou e-mail, ao menos 2 letras'}
          />
          {leitores.length > 0 ? (
            <div style={{ display: 'grid', gap: 'calc(var(--u) * 1.5)' }}>
              {leitores.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setLeitor(u)}
                  className="win-flat"
                  style={{
                    padding: 'calc(var(--u) * 2.5) calc(var(--u) * 3)',
                    cursor: 'pointer',
                    font: 'inherit',
                    color: 'inherit',
                    textAlign: 'left',
                    display: 'flex',
                    gap: 'calc(var(--u) * 2)',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ flex: 1 }}>{u.name}</span>
                  <span className="dado">{u.email}</span>
                  <Proximo />
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}

      <Btn
        variant="primary"
        icon="emprestar"
        disabled={!leitor}
        loading={enviando}
        onClick={emprestar}
      >
        Emprestar em nome de {leitor ? leitor.name.split(' ')[0] : '…'}
      </Btn>

      <p className="dado" style={{ margin: 0 }}>
        Registrado por {operador.name}.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- Devolver */

function Devolver({
  loanId,
  onFeito,
  onBloqueio,
}: {
  loanId: string;
  onFeito: (t: string) => void;
  onBloqueio: (t: string) => void;
}) {
  const [devolvendo, setDevolvendo] = useState(false);
  const [renovando, setRenovando] = useState(false);

  async function devolver() {
    setDevolvendo(true);
    try {
      const l: Loan = await api.returnLoan(loanId);
      const multa = l.fine > 0 ? ` Multa de ${reais(l.fine)} (${l.daysLate} ${plural(l.daysLate, 'dia', 'dias')} de atraso).` : ' Sem multa.';
      const fila = l.reservaAcionada ? ' O exemplar já foi separado para o próximo da fila.' : '';
      onFeito(`Devolução registrada.${multa}${fila}`);
    } catch (err) {
      onBloqueio(msg(err));
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
      onBloqueio(msg(err));
    } finally {
      setRenovando(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 2)' }}>
        <Proximo />
        <span className="label">Próximo passo · receber de volta</span>
      </div>
      <div style={{ display: 'flex', gap: 'calc(var(--u) * 3)', flexWrap: 'wrap' }}>
        <Btn variant="primary" icon="devolver" loading={devolvendo} onClick={devolver}>
          Registrar devolução
        </Btn>
        <Btn icon="reserva" loading={renovando} onClick={renovar}>
          Renovar prazo
        </Btn>
      </div>
      <p className="label" style={{ margin: 0 }}>
        A multa é calculada pelo servidor no momento da devolução.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------- O campo -- */

/** O que está fora da estante agora, atrasados na frente. */
function OCampo({ versao }: { versao: number }) {
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
    <Win title="Fora da estante agora" icon="pilha" grow>
      {loans === null ? (
        <Carregando />
      ) : loans.length === 0 ? (
        <Vazio>Nenhum exemplar emprestado no momento.</Vazio>
      ) : (
        <div style={{ display: 'grid', gap: 'calc(var(--u) * 1.5)' }}>
          {[...loans]
            .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue))
            .map((l) => (
              <div
                key={l.id}
                className="win-flat"
                style={{
                  // Flex com quebra em vez de grade rigida: no celular a coluna
                  // do tombo era esmagada e o titulo sumia por completo.
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'calc(var(--u) * 3)',
                  alignItems: 'center',
                  padding: 'calc(var(--u) * 2.5) calc(var(--u) * 3)',
                  borderColor: l.isOverdue ? 'var(--lamp)' : 'var(--ink)',
                }}
              >
                <strong
                  style={{ fontFamily: 'var(--font-chrome)', fontSize: 12, whiteSpace: 'nowrap' }}
                >
                  {l.copy.code}
                </strong>
                <span style={{ flex: '1 1 180px', minWidth: 0, overflow: 'hidden' }}>
                  {l.copy.book.title}
                  <span className="dado" style={{ marginLeft: 8 }}>
                    {l.user.name}
                  </span>
                </span>
                <span className="num dado">{dia(l.dueAt)}</span>
                {l.isOverdue ? (
                  <Tag alarm>
                    <Counter value={l.daysLate} places={2} /> dias
                  </Tag>
                ) : (
                  <Tag>no prazo</Tag>
                )}
              </div>
            ))}
        </div>
      )}
    </Win>
  );
}

/* ------------------------------------------------------------------ util -- */

export function SituacaoTag({ status, onDark }: { status: Copy['status']; onDark?: boolean }) {
  // Quatro pesos, nao quatro palavras: invertido libera acao, contorno esta
  // em curso, tracejado espera, lampada trava o atendimento.
  const mapa: Record<
    Copy['status'],
    { texto: string; strong?: boolean; alarm?: boolean; dashed?: boolean }
  > = {
    AVAILABLE: { texto: 'na estante', strong: true },
    ON_LOAN: { texto: 'emprestado' },
    RESERVED: { texto: 'separado', dashed: true },
    MAINTENANCE: { texto: 'manutenção', alarm: true },
    LOST: { texto: 'perdido', alarm: true },
  };
  const m = mapa[status];
  return (
    <Tag strong={m.strong} alarm={m.alarm} dashed={m.dashed} onDark={onDark}>
      {m.texto}
    </Tag>
  );
}

export function msg(err: unknown) {
  return err instanceof ApiError ? err.message : 'Erro inesperado. Tente de novo.';
}
