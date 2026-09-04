import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Loan } from '../api/types';
import { dia, plural, reais } from '../format';
import { Btn, Carregando, Carta, Recado, Selo, Vazio } from '../ui/kit';
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
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'trava'; texto: string } | null>(null);

  const carregar = useCallback(() => {
    setLoans(null);
    const params =
      filtro === 'overdue' ? { overdue: true, perPage: 25 } : { status: filtro, perPage: 25 };
    api
      .loans(params)
      .then((r) => {
        setLoans(r.data);
        setTotal(r.meta.total);
      })
      .catch((e) => {
        setLoans([]);
        setAviso({ tipo: 'trava', texto: msg(e) });
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
      setAviso({ tipo: 'ok', texto: `${l.copy.code} devolvido. ${multa}` });
      carregar();
    } catch (e) {
      setAviso({ tipo: 'trava', texto: msg(e) });
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 6)' }}>
      <header>
        <h1>Empréstimos</h1>
        <p className="sub" style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15, color: 'var(--tinta-campo)' }}>
          Tudo que saiu, e o que já passou do prazo.
        </p>
      </header>

      <div className="abas" role="tablist">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filtro === f.id}
            onClick={() => setFiltro(f.id)}
            className={`toque aba ${filtro === f.id ? 'aba-ativa' : ''}`}
          >
            {f.nome}
          </button>
        ))}
      </div>

      {aviso ? (
        <Recado tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Recado>
      ) : null}

      <Carta
        titulo={FILTROS.find((f) => f.id === filtro)!.nome}
        icone="pilha"
        padding={false}
        direita={loans ? <Selo>{total}</Selo> : null}
      >
        {loans === null ? (
          <div style={{ padding: 'calc(var(--u) * 5)' }}>
            <Carregando linhas={4} />
          </div>
        ) : loans.length === 0 ? (
          <Vazio icone={filtro === 'overdue' ? 'check' : 'estante'}>
            {filtro === 'overdue'
              ? 'Nenhum atraso. Dia tranquilo no balcão.'
              : filtro === 'ACTIVE'
                ? 'Nenhum empréstimo em curso.'
                : 'Nenhuma devolução registrada ainda.'}
          </Vazio>
        ) : (
          <ul className="lista">
            {loans.map((l) => (
              <Linha key={l.id} loan={l} onDevolver={() => devolver(l.id)} />
            ))}
          </ul>
        )}
      </Carta>

      <style>{`
        .abas {
          display: inline-flex; gap: 2px; padding: 3px;
          background: var(--campo-2); border-radius: 12px; width: fit-content;
        }
        .aba {
          border: 0; background: transparent; cursor: pointer;
          font: inherit; font-size: 14px; font-weight: 700; letter-spacing: -0.01em;
          color: var(--tinta-2);
          padding: calc(var(--u) * 2) calc(var(--u) * 4);
          border-radius: 9px;
        }
        .aba-ativa {
          background: var(--papel); color: var(--tinta);
          box-shadow: var(--sombra-1);
        }
        .lista { list-style: none; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

function Linha({ loan, onDevolver }: { loan: Loan; onDevolver: () => void }) {
  const devolvido = Boolean(loan.returnedAt);

  return (
    <li className="linha">
      <span className="cod" style={{ color: 'var(--tinta-3)', width: 88 }}>
        {loan.copy.code}
      </span>

      <span style={{ flex: '1 1 240px', minWidth: 0 }}>
        <strong style={{ display: 'block', fontSize: 14.5, letterSpacing: '-0.01em' }}>
          {loan.copy.book.title}
        </strong>
        <span className="sub">
          {loan.user.name} · {devolvido ? 'devolvido' : 'volta'} em{' '}
          <span className="num">{dia(loan.returnedAt ?? loan.dueAt)}</span>
          {loan.renewals > 0 ? ` · renovado ${loan.renewals}×` : ''}
        </span>
      </span>

      {devolvido ? (
        loan.fine > 0 ? (
          <Selo tom="alerta">multa {reais(loan.fine)}</Selo>
        ) : (
          <Selo tom="ok">sem multa</Selo>
        )
      ) : loan.fineDue > 0 ? (
        <Selo tom="trava" ponto>
          devendo {reais(loan.fineDue)}
        </Selo>
      ) : (
        <Selo tom="ok">no prazo</Selo>
      )}

      {!devolvido ? (
        <Btn icone="devolver" size="sm" onClick={onDevolver}>
          Devolver
        </Btn>
      ) : null}

      <style>{`
        .linha {
          display: flex; align-items: center; gap: calc(var(--u) * 4);
          padding: calc(var(--u) * 3.5) calc(var(--u) * 5);
          border-bottom: 1px solid var(--linha); flex-wrap: wrap;
          transition: background-color 0.14s ease;
        }
        .linha:last-child { border-bottom: 0; }
        .linha:hover { background: var(--campo); }
      `}</style>
    </li>
  );
}
