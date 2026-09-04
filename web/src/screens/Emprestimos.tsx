import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Loan } from '../api/types';
import { dia, plural, reais } from '../format';
import { Btn, Carregando, Counter, Lamp, Recado, Tag, Vazio, Win } from '../ui/kit';
import { msg } from './Balcao';

type Filtro = 'ACTIVE' | 'overdue' | 'RETURNED';

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: 'ACTIVE', nome: 'Em curso' },
  { id: 'overdue', nome: 'Em atraso' },
  { id: 'RETURNED', nome: 'Devolvidos' },
];

export function Emprestimos() {
  const [filtro, setFiltro] = useState<Filtro>('ACTIVE');
  const [loans, setLoans] = useState<Loan[] | null>(null);
  const [total, setTotal] = useState(0);
  const [recado, setRecado] = useState<{ kind: 'ok' | 'bloqueio'; texto: string } | null>(null);

  const carregar = useCallback(() => {
    setLoans(null);
    const params =
      filtro === 'overdue'
        ? { overdue: true, perPage: 25 }
        : { status: filtro, perPage: 25 };
    api
      .loans(params)
      .then((r) => {
        setLoans(r.data);
        setTotal(r.meta.total);
      })
      .catch((e) => {
        setLoans([]);
        setRecado({ kind: 'bloqueio', texto: msg(e) });
      });
  }, [filtro]);

  useEffect(carregar, [carregar]);

  async function devolver(id: string) {
    try {
      const l = await api.returnLoan(id);
      const multa =
        l.fine > 0
          ? `Multa de ${reais(l.fine)} — ${l.daysLate} ${plural(l.daysLate, 'dia', 'dias')} de atraso.`
          : 'Sem multa.';
      setRecado({ kind: 'ok', texto: `${l.copy.code} devolvido. ${multa}` });
      carregar();
    } catch (e) {
      setRecado({ kind: 'bloqueio', texto: msg(e) });
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)', maxWidth: 1100 }}>
      <div
        className="win"
        style={{ padding: 'calc(var(--u) * 3)', display: 'flex', gap: 'calc(var(--u) * 2)', flexWrap: 'wrap' }}
      >
        {FILTROS.map((f) => (
          <Btn
            key={f.id}
            variant={filtro === f.id ? 'primary' : 'ghost'}
            onClick={() => setFiltro(f.id)}
          >
            {f.nome}
          </Btn>
        ))}
      </div>

      {recado ? (
        <Recado kind={recado.kind} onClose={() => setRecado(null)}>
          {recado.texto}
        </Recado>
      ) : null}

      <Win
        title={filtro === 'overdue' ? 'Em atraso' : filtro === 'ACTIVE' ? 'Em curso' : 'Devolvidos'}
        icon="devolver"
        right={
          loans ? (
            <span className="label" style={{ color: 'var(--pale)', opacity: 1 }}>
              <Counter value={total} />
            </span>
          ) : null
        }
      >
        {loans === null ? (
          <Carregando />
        ) : loans.length === 0 ? (
          <Vazio>
            {filtro === 'overdue'
              ? 'Nenhum atraso. Bom dia no balcão.'
              : filtro === 'ACTIVE'
                ? 'Nenhum empréstimo em curso.'
                : 'Nenhuma devolução registrada ainda.'}
          </Vazio>
        ) : (
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }}>
            {loans.map((l) => (
              <Linha key={l.id} loan={l} onDevolver={() => devolver(l.id)} />
            ))}
          </div>
        )}
      </Win>
    </div>
  );
}

function Linha({ loan, onDevolver }: { loan: Loan; onDevolver: () => void }) {
  const devolvido = Boolean(loan.returnedAt);

  return (
    <div
      className="win-flat"
      style={{
        padding: 'calc(var(--u) * 3)',
        borderColor: loan.isOverdue ? 'var(--lamp)' : 'var(--ink)',
        display: 'grid',
        gap: 'calc(var(--u) * 3)',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 2)', flexWrap: 'wrap' }}>
          <strong style={{ fontFamily: 'var(--font-chrome)', fontSize: 12 }}>{loan.copy.code}</strong>
          <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {loan.copy.book.title}
          </strong>
          {loan.isOverdue ? <Lamp label="Em atraso" /> : null}
        </div>
        <div className="label" style={{ marginTop: 4, display: 'flex', gap: 'calc(var(--u) * 3)', flexWrap: 'wrap' }}>
          <span>{loan.user.name}</span>
          <span className="num">
            {devolvido ? 'devolvido' : 'volta'} em {dia(loan.returnedAt ?? loan.dueAt)}
          </span>
          {loan.renewals > 0 ? <span>renovado {loan.renewals}×</span> : null}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 3)' }}>
        {devolvido ? (
          loan.fine > 0 ? (
            <Tag alarm>multa {reais(loan.fine)}</Tag>
          ) : (
            <Tag>sem multa</Tag>
          )
        ) : loan.fineDue > 0 ? (
          <Tag alarm>
            devendo {reais(loan.fineDue)}
          </Tag>
        ) : (
          <Tag>no prazo</Tag>
        )}

        {!devolvido ? (
          <Btn icon="devolver" onClick={onDevolver}>
            Devolver
          </Btn>
        ) : null}
      </div>
    </div>
  );
}
