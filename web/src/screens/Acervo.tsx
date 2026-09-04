import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Book } from '../api/types';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Carregando, Carta, Recado, Selo, Vazio } from '../ui/kit';
import { msg, SituacaoSelo } from './Balcao';

export function Acervo() {
  const [busca, setBusca] = useState('');
  const [soDisponiveis, setSoDisponiveis] = useState(false);
  const [livros, setLivros] = useState<Book[] | null>(null);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    setErro(null);
    const t = setTimeout(() => {
      api
        .books({
          search: busca.trim() || undefined,
          available: soDisponiveis || undefined,
          perPage: 12,
        })
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
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 6)' }}>
      <header>
        <h1>Acervo</h1>
        <p className="sub" style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15 }}>
          Uma busca cobre título, autor, editora e ISBN de uma vez.
        </p>
      </header>

      <div className="filtro">
        <div style={{ flex: '1 1 300px' }}>
          <Campo
            id="acervo-busca"
            label="Buscar"
            value={busca}
            onChange={setBusca}
            autoFocus
            icone="busca"
          />
        </div>
        <div style={{ paddingTop: 26 }}>
          <Btn
            variant={soDisponiveis ? 'acao' : 'suave'}
            icone={soDisponiveis ? 'check' : 'estante'}
            onClick={() => setSoDisponiveis((v) => !v)}
          >
            Só o que está na estante
          </Btn>
        </div>
      </div>

      {erro ? <Recado tipo="trava">{erro}</Recado> : null}

      <Carta
        titulo="Obras"
        icone="acervo"
        padding={false}
        direita={livros ? <Selo>{total} no total</Selo> : null}
      >
        {livros === null ? (
          <div style={{ padding: 'calc(var(--u) * 5)' }}>
            <Carregando linhas={4} />
          </div>
        ) : livros.length === 0 ? (
          <Vazio icone="busca">Nada no acervo bate com essa busca. Tente outro termo.</Vazio>
        ) : (
          <ul className="lista">
            {livros.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => setAberto(aberto === b.id ? null : b.id)}
                  className="obra"
                  aria-expanded={aberto === b.id}
                >
                  <span style={{ flex: '1 1 260px', minWidth: 0, textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: 15, letterSpacing: '-0.01em' }}>
                      {b.title}
                    </strong>
                    <span className="sub">
                      {b.authors.map((a) => a.name).join(', ')}
                      {b.publishedYear ? ` · ${b.publishedYear}` : ''}
                      {b.category ? ` · ${b.category.name}` : ''}
                    </span>
                  </span>

                  <Disponibilidade livre={b.availableCopies ?? 0} total={b.totalCopies} />

                  <span
                    style={{
                      color: 'var(--tinta-3)',
                      transform: aberto === b.id ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s var(--saida)',
                    }}
                  >
                    <Icon name="seta" size={16} />
                  </span>
                </button>

                {aberto === b.id ? <Exemplares id={b.id} /> : null}
              </li>
            ))}
          </ul>
        )}
      </Carta>

      <style>{`
        .filtro {
          display: flex; gap: calc(var(--u) * 4); align-items: flex-start; flex-wrap: wrap;
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: var(--r-g); padding: calc(var(--u) * 5);
          box-shadow: var(--sombra-1);
        }
        .lista { list-style: none; margin: 0; padding: 0; }
        .lista > li { border-bottom: 1px solid var(--linha); }
        .lista > li:last-child { border-bottom: 0; }
        .obra {
          display: flex; align-items: center; gap: calc(var(--u) * 4);
          width: 100%; padding: calc(var(--u) * 4) calc(var(--u) * 5);
          background: transparent; border: 0; cursor: pointer;
          font: inherit; color: var(--tinta); flex-wrap: wrap;
          transition: background-color 0.14s ease;
        }
        .obra:hover { background: var(--campo); }
      `}</style>
    </div>
  );
}

function Disponibilidade({ livre, total }: { livre: number; total: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--u) * 2)' }}>
      <Selo tom={livre > 0 ? 'ok' : 'neutro'} ponto>
        {livre > 0 ? `${livre} na estante` : 'tudo emprestado'}
      </Selo>
      <span className="sub num">de {total}</span>
    </span>
  );
}

function Exemplares({ id }: { id: string }) {
  const [livro, setLivro] = useState<Book | null>(null);

  useEffect(() => {
    setLivro(null);
    api
      .book(id)
      .then(setLivro)
      .catch(() => setLivro(null));
  }, [id]);

  return (
    <div className="gaveta surge">
      {!livro ? (
        <Carregando linhas={2} />
      ) : (
        <>
          {livro.synopsis ? (
            <p className="sub prosa" style={{ margin: '0 0 calc(var(--u) * 4)' }}>
              {livro.synopsis}
            </p>
          ) : null}
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }}>
            {(livro.copies ?? []).map((c) => (
              <div key={c.id} className="exemplar">
                <span className="cod">{c.code}</span>
                <span className="sub" style={{ flex: 1 }}>
                  {c.shelf ? `estante ${c.shelf}` : 'sem estante definida'}
                </span>
                <SituacaoSelo status={c.status} />
              </div>
            ))}
            {(livro.copies ?? []).length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>
                Esta obra não tem exemplar tombado.
              </p>
            ) : null}
          </div>
        </>
      )}

      <style>{`
        .gaveta {
          padding: calc(var(--u) * 5);
          background: var(--campo);
          border-top: 1px solid var(--linha);
        }
        .exemplar {
          display: flex; align-items: center; gap: calc(var(--u) * 3);
          padding: calc(var(--u) * 2.5) calc(var(--u) * 3.5);
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: var(--r);
        }
      `}</style>
    </div>
  );
}
