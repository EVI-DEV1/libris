import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Reservation } from '../api/types';
import { dia } from '../format';
import { Btn, Carregando, Counter, Recado, Tag, Vazio, Win } from '../ui/kit';
import { msg } from './Balcao';

type Filtro = 'WAITING' | 'READY';

export function Reservas() {
  const [filtro, setFiltro] = useState<Filtro>('READY');
  const [reservas, setReservas] = useState<Reservation[] | null>(null);
  const [recado, setRecado] = useState<{ kind: 'ok' | 'bloqueio' | 'aviso'; texto: string } | null>(
    null,
  );

  const carregar = useCallback(() => {
    setReservas(null);
    api
      .reservations({ status: filtro, perPage: 25 })
      .then((r) => setReservas(r.data))
      .catch((e) => {
        setReservas([]);
        setRecado({ kind: 'bloqueio', texto: msg(e) });
      });
  }, [filtro]);

  useEffect(carregar, [carregar]);

  async function cancelar(id: string) {
    try {
      await api.cancelReservation(id);
      setRecado({ kind: 'ok', texto: 'Reserva cancelada. O exemplar voltou para a fila.' });
      carregar();
    } catch (e) {
      setRecado({ kind: 'bloqueio', texto: msg(e) });
    }
  }

  async function expirar() {
    try {
      const r = await api.expireStale();
      setRecado({
        kind: r.expiradas > 0 ? 'ok' : 'aviso',
        texto:
          r.expiradas > 0
            ? `${r.expiradas} reserva(s) vencida(s) liberada(s). Os exemplares voltaram a circular.`
            : 'Nenhuma reserva passou do prazo de retirada.',
      });
      carregar();
    } catch (e) {
      setRecado({ kind: 'bloqueio', texto: msg(e) });
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)', maxWidth: 1100 }}>
      <div
        className="win"
        style={{
          padding: 'calc(var(--u) * 3)',
          display: 'flex',
          gap: 'calc(var(--u) * 2)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Btn variant={filtro === 'READY' ? 'primary' : 'ghost'} onClick={() => setFiltro('READY')}>
          Separadas no balcão
        </Btn>
        <Btn variant={filtro === 'WAITING' ? 'primary' : 'ghost'} onClick={() => setFiltro('WAITING')}>
          Na fila
        </Btn>
        <span style={{ flex: 1 }} />
        <Btn icon="reserva" onClick={expirar}>
          Liberar as vencidas
        </Btn>
      </div>

      {recado ? (
        <Recado kind={recado.kind} onClose={() => setRecado(null)}>
          {recado.texto}
        </Recado>
      ) : null}

      <Win
        title={filtro === 'READY' ? 'Esperando retirada' : 'Fila de espera'}
        icon="reserva"
        right={
          reservas ? (
            <span className="label" style={{ color: 'var(--pale)', opacity: 1 }}>
              <Counter value={reservas.length} places={2} />
            </span>
          ) : null
        }
      >
        {reservas === null ? (
          <Carregando />
        ) : reservas.length === 0 ? (
          <Vazio>
            {filtro === 'READY'
              ? 'Nenhum exemplar separado no balcão.'
              : 'Ninguém na fila. Todo mundo achou o que queria na estante.'}
          </Vazio>
        ) : (
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }}>
            {reservas.map((r, i) => {
              const vencida = r.expiresAt ? new Date(r.expiresAt).getTime() < Date.now() : false;
              return (
                <div
                  key={r.id}
                  className="win-flat"
                  style={{
                    padding: 'calc(var(--u) * 3)',
                    borderColor: vencida ? 'var(--lamp)' : 'var(--ink)',
                    display: 'grid',
                    gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
                    gap: 'calc(var(--u) * 3)',
                    alignItems: 'center',
                  }}
                >
                  {/* A fila é FIFO: a posição é a informação, então ela é o primeiro elemento. */}
                  <span
                    style={{
                      fontFamily: 'var(--font-chrome)',
                      background: 'var(--ink)',
                      color: 'var(--pale)',
                      borderRadius: 4,
                      padding: '4px 7px',
                      fontSize: 12,
                    }}
                  >
                    <Counter value={i + 1} places={2} />
                  </span>

                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.book.title}
                    </strong>
                    <span className="label">{r.user.name}</span>
                  </span>

                  {r.expiresAt ? (
                    <Tag alarm={vencida}>
                      {vencida ? 'prazo vencido' : `retirar até ${dia(r.expiresAt)}`}
                    </Tag>
                  ) : (
                    <Tag>desde {dia(r.createdAt)}</Tag>
                  )}

                  <Btn icon="x" onClick={() => cancelar(r.id)}>
                    Cancelar
                  </Btn>
                </div>
              );
            })}
          </div>
        )}
      </Win>
    </div>
  );
}
