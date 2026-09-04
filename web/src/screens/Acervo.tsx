import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Book } from '../api/types';
import { Btn, Carregando, Counter, Field, Recado, Tag, Vazio, Win } from '../ui/kit';
import { PixelIcon } from '../ui/PixelIcon';
import { msg, SituacaoTag } from './Balcao';

export function Acervo() {
  const [busca, setBusca] = useState('');
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const [livros, setLivros] = useState<Book[] | null>(null);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Book | null>(null);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    const t = setTimeout(() => {
      api
        .books({ search: busca.trim() || undefined, available: soDisponiveis || undefined, perPage: 12 })
        .then((r) => {
          if (!vivo) return;
          setLivros(r.data);
          setTotal(r.meta.total);
        })
        .catch((e) => vivo && setErro(msg(e)));
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [busca, soDisponiveis]);

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)', maxWidth: 1100 }}>
      <div className="win" style={{ padding: 'calc(var(--u) * 4)' }}>
        <div style={{ display: 'flex', gap: 'calc(var(--u) * 3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px' }}>
            <Field
              id="acervo-busca"
              label="Buscar no acervo"
              value={busca}
              onChange={setBusca}
              autoFocus
              hint="título, autor, editora ou ISBN — uma busca só cobre os quatro"
            />
          </div>
          <Btn
            variant={soDisponiveis ? 'primary' : 'ghost'}
            icon={soDisponiveis ? 'check' : 'acervo'}
            onClick={() => setSoDisponiveis((v) => !v)}
          >
            Só o que está na estante
          </Btn>
        </div>
      </div>

      {erro ? <Recado kind="bloqueio">{erro}</Recado> : null}

      <Win
        title="Acervo"
        icon="acervo"
        right={
          livros ? (
            <span className="label" style={{ color: 'var(--pale)', opacity: 1 }}>
              <Counter value={total} /> obras
            </span>
          ) : null
        }
      >
        {livros === null ? (
          <Carregando />
        ) : livros.length === 0 ? (
          <Vazio>Nada no acervo bate com essa busca.</Vazio>
        ) : (
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }}>
            {livros.map((b) => (
              <button
                key={b.id}
                onClick={() => setAberto(b)}
                className="win-flat"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 'calc(var(--u) * 3)',
                  alignItems: 'center',
                  padding: 'calc(var(--u) * 3)',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>{b.title}</strong>
                  <span className="label">
                    {b.authors.map((a) => a.name).join(', ')}
                    {b.publishedYear ? ` · ${b.publishedYear}` : ''}
                    {b.category ? ` · ${b.category.name}` : ''}
                  </span>
                </span>
                <Disponibilidade livre={b.availableCopies ?? 0} total={b.totalCopies} />
              </button>
            ))}
          </div>
        )}
      </Win>

      {aberto ? <FichaDaObra id={aberto.id} onFechar={() => setAberto(null)} /> : null}
    </div>
  );
}

function Disponibilidade({ livre, total }: { livre: number; total: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--u) * 2)' }}>
      <Tag strong={livre > 0} alarm={livre === 0}>
        {livre > 0 ? 'na estante' : 'tudo fora'}
      </Tag>
      <span className="label num">
        <Counter value={livre} /> de <Counter value={total} />
      </span>
    </span>
  );
}

function FichaDaObra({ id, onFechar }: { id: string; onFechar: () => void }) {
  const [livro, setLivro] = useState<Book | null>(null);

  useEffect(() => {
    setLivro(null);
    api.book(id).then(setLivro).catch(() => setLivro(null));
  }, [id]);

  return (
    <Win
      title={livro ? livro.title : 'Abrindo a ficha'}
      icon="acervo"
      right={
        <button
          onClick={onFechar}
          aria-label="Fechar ficha"
          style={{
            background: 'transparent',
            border: '2px solid var(--pale)',
            color: 'var(--pale)',
            borderRadius: 4,
            padding: 3,
            cursor: 'pointer',
            display: 'inline-flex',
          }}
        >
          <PixelIcon name="x" size={11} />
        </button>
      }
    >
      {!livro ? (
        <Carregando />
      ) : (
        <div style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
          <p className="label" style={{ margin: 0 }}>
            {livro.authors.map((a) => a.name).join(', ')} · ISBN {livro.isbn}
            {livro.publisher ? ` · ${livro.publisher}` : ''}
          </p>

          {livro.synopsis ? <p className="prose" style={{ margin: 0 }}>{livro.synopsis}</p> : null}

          <div>
            <h2 style={{ marginBottom: 'calc(var(--u) * 2)' }}>Exemplares</h2>
            <div style={{ display: 'grid', gap: 'calc(var(--u) * 1.5)' }}>
              {(livro.copies ?? []).map((c) => (
                <div
                  key={c.id}
                  className="win-flat"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'calc(var(--u) * 3)',
                    padding: 'calc(var(--u) * 2.5) calc(var(--u) * 3)',
                  }}
                >
                  <strong style={{ fontFamily: 'var(--font-chrome)', fontSize: 12 }}>{c.code}</strong>
                  <span className="label" style={{ flex: 1 }}>
                    {c.shelf ? `estante ${c.shelf}` : 'sem estante'}
                  </span>
                  <SituacaoTag status={c.status} />
                </div>
              ))}
              {(livro.copies ?? []).length === 0 ? (
                <Vazio>Esta obra não tem exemplar tombado.</Vazio>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </Win>
  );
}
