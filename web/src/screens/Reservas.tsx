import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Reservation } from '../api/types';
import { dia } from '../format';
import { Btn, Carregando, Carta, Recado, Selo, Vazio } from '../ui/kit';
import { msg } from './Balcao';

type Filtro = 'READY' | 'WAITING';

const FILTROS: { id: Filtro; nome: string }[] = [
  { id: 'READY', nome: 'Separadas no balcão' },
  { id: 'WAITING', nome: 'Na fila' },
];

export function Reservas() {
  const [filtro, setFiltro] = useState<Filtro>('READY');
  const [reservas, setReservas] = useState<Reservation[] | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'trava' | 'aviso'; texto: string } | null>(null);

  const carregar = useCallback(() => {
    setReservas(null);
    api
      .reservations({ status: filtro, perPage: 25 })
      .then((r) => setReservas(r.data))
      .catch((e) => {
        setReservas([]);
        setAviso({ tipo: 'trava', texto: msg(e) });
      });
  }, [filtro]);

  useEffect(carregar, [carregar]);

  async function cancelar(id: string) {
    try {
      await api.cancelReservation(id);
      setAviso({ tipo: 'ok', texto: 'Reserva cancelada. O exemplar voltou para a fila.' });
      carregar();
    } catch (e) {
      setAviso({ tipo: 'trava', texto: msg(e) });
    }
  }

  async function expirar() {
    try {
      const r = await api.expireStale();
      setAviso({
        tipo: r.expiradas > 0 ? 'ok' : 'aviso',
        texto:
          r.expiradas > 0
            ? `${r.expiradas} reserva(s) vencida(s) liberada(s). Os exemplares voltaram a circular.`
            : 'Nenhuma reserva passou do prazo de retirada.',
      });
      carregar();
    } catch (e) {
      setAviso({ tipo: 'trava', texto: msg(e) });
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 6)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 'calc(var(--u) * 4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1>Reservas</h1>
          <p className="sub" style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15, color: 'var(--tinta-campo)' }}>
            A fila é por ordem de chegada, e quem espera tem prioridade sobre quem renova.
          </p>
        </div>
        <Btn icone="reserva" onClick={expirar}>
          Liberar as vencidas
        </Btn>
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
        titulo={filtro === 'READY' ? 'Esperando retirada' : 'Fila de espera'}
        icone="reserva"
        padding={false}
        direita={reservas ? <Selo>{reservas.length}</Selo> : null}
      >
        {reservas === null ? (
          <div style={{ padding: 'calc(var(--u) * 5)' }}>
            <Carregando linhas={3} />
          </div>
        ) : reservas.length === 0 ? (
          <Vazio icone="reserva">
            {filtro === 'READY'
              ? 'Nenhum exemplar separado no balcão.'
              : 'Ninguém na fila. Todo mundo achou o que queria na estante.'}
          </Vazio>
        ) : (
          <ul className="lista">
            {reservas.map((r, i) => {
              const vencida = r.expiresAt ? new Date(r.expiresAt).getTime() < Date.now() : false;
              return (
                <li key={r.id} className="linha">
                  {/* A fila é FIFO: a posição é a informação, então vem primeiro. */}
                  <span className="posicao">{i + 1}</span>

                  <span style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: 14.5, letterSpacing: '-0.01em' }}>
                      {r.book.title}
                    </strong>
                    <span className="sub">{r.user.name}</span>
                  </span>

                  {r.expiresAt ? (
                    <Selo tom={vencida ? 'trava' : 'espera'} ponto={vencida}>
                      {vencida ? 'prazo vencido' : `retirar até ${dia(r.expiresAt)}`}
                    </Selo>
                  ) : (
                    <Selo>desde {dia(r.createdAt)}</Selo>
                  )}

                  <Btn variant="fantasma" size="sm" icone="x" onClick={() => cancelar(r.id)}>
                    Cancelar
                  </Btn>
                </li>
              );
            })}
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
        .aba-ativa { background: var(--papel); color: var(--tinta); box-shadow: var(--sombra-1); }
        .lista { list-style: none; margin: 0; padding: 0; }
        .linha {
          display: flex; align-items: center; gap: calc(var(--u) * 4);
          padding: calc(var(--u) * 3.5) calc(var(--u) * 5);
          border-bottom: 1px solid var(--linha); flex-wrap: wrap;
        }
        .linha:last-child { border-bottom: 0; }
        .linha:hover { background: var(--campo); }
        .posicao {
          width: 30px; height: 30px; flex: none; border-radius: 9px;
          background: var(--acao-fraca); color: var(--acao-tinta);
          display: grid; place-items: center;
          font-family: var(--mono); font-size: 13px; font-weight: 700;
        }
      `}</style>
    </div>
  );
}
