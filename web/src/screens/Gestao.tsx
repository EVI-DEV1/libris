import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Author, Book, Category, Copy, CopyStatus } from '../api/types';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Carregando, Carta, Recado, Selo, Vazio } from '../ui/kit';
import { msg, SituacaoSelo } from './Balcao';

type Aviso = { tipo: 'ok' | 'trava' | 'aviso'; texto: string } | null;
type Aba = 'obra' | 'estoque';

/**
 * Gestão do acervo: entra obra nova no catálogo e exemplar novo na estante.
 *
 * Só aparece para ADMIN e LIBRARIAN — mas quem recusa de verdade é o servidor.
 * Esconder o que não adianta é cortesia da tela, não é a trava.
 */
export function Gestao() {
  const [aba, setAba] = useState<Aba>('obra');
  const [aviso, setAviso] = useState<Aviso>(null);
  const [versao, setVersao] = useState(0);

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 6)' }}>
      <header>
        <h1>Gestão do acervo</h1>
        <p
          className="sub"
          style={{ margin: 'calc(var(--u) * 1.5) 0 0', fontSize: 15, color: 'var(--tinta-campo)' }}
        >
          A obra entra no catálogo uma vez. Cada volume físico dela é um exemplar,
          e é o exemplar que circula.
        </p>
      </header>

      <div className="abas" role="tablist">
        <button
          role="tab"
          aria-selected={aba === 'obra'}
          onClick={() => setAba('obra')}
          className={`toque aba ${aba === 'obra' ? 'aba-ativa' : ''}`}
        >
          Nova obra
        </button>
        <button
          role="tab"
          aria-selected={aba === 'estoque'}
          onClick={() => setAba('estoque')}
          className={`toque aba ${aba === 'estoque' ? 'aba-ativa' : ''}`}
        >
          Estoque de exemplares
        </button>
      </div>

      {aviso ? (
        <Recado tipo={aviso.tipo} onFechar={() => setAviso(null)}>
          {aviso.texto}
        </Recado>
      ) : null}

      {aba === 'obra' ? (
        <NovaObra
          onFeito={(t) => {
            setAviso({ tipo: 'ok', texto: t });
            setVersao((v) => v + 1);
          }}
          onTrava={(t) => setAviso({ tipo: 'trava', texto: t })}
        />
      ) : (
        <Estoque
          versao={versao}
          onFeito={(t) => {
            setAviso({ tipo: 'ok', texto: t });
            setVersao((v) => v + 1);
          }}
          onTrava={(t) => setAviso({ tipo: 'trava', texto: t })}
        />
      )}

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
        .grade {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: calc(var(--u) * 4);
        }
        .lista { list-style: none; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------------- Nova obra */

function NovaObra({
  onFeito,
  onTrava,
}: {
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [isbn, setIsbn] = useState('');
  const [titulo, setTitulo] = useState('');
  const [editora, setEditora] = useState('');
  const [ano, setAno] = useState('');
  const [sinopse, setSinopse] = useState('');
  const [autores, setAutores] = useState<Author[]>([]);
  const [categoria, setCategoria] = useState<Category | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [criada, setCriada] = useState<Book | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (autores.length === 0) {
      onTrava('Escolha ao menos um autor — a API exige, porque obra sem autoria não se cataloga.');
      return;
    }
    setEnviando(true);
    try {
      const b = await api.createBook({
        isbn: isbn.trim(),
        title: titulo.trim(),
        authorIds: autores.map((a) => a.id),
        ...(categoria ? { categoryId: categoria.id } : {}),
        ...(editora.trim() ? { publisher: editora.trim() } : {}),
        ...(ano.trim() ? { publishedYear: Number(ano) } : {}),
        ...(sinopse.trim() ? { synopsis: sinopse.trim() } : {}),
      });
      setCriada(b);
      onFeito(`“${b.title}” entrou no catálogo. Agora tombe os exemplares dela.`);
      setIsbn('');
      setTitulo('');
      setEditora('');
      setAno('');
      setSinopse('');
      setAutores([]);
      setCategoria(null);
    } catch (err) {
      onTrava(msg(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <form onSubmit={salvar}>
        <Carta titulo="Obra nova" icone="acervo">
          <div style={{ display: 'grid', gap: 'calc(var(--u) * 5)' }}>
            <div className="grade">
              <Campo
                id="isbn"
                label="ISBN"
                value={isbn}
                onChange={setIsbn}
                dica="10 ou 13 dígitos. Pode digitar com hífen."
              />
              <Campo id="titulo" label="Título" value={titulo} onChange={setTitulo} />
            </div>

            <Escolhedor
              rotulo="Autores"
              itens={autores}
              onMuda={setAutores}
              buscar={(t) => api.authors({ search: t, perPage: 6 }).then((r) => r.data)}
              criar={(nome) => api.createAuthor(nome)}
              multiplo
              dica="Obrigatório. Se o autor ainda não existe, dá para criar aqui mesmo."
            />

            <Escolhedor
              rotulo="Categoria"
              itens={categoria ? [categoria] : []}
              onMuda={(l) => setCategoria(l[0] ?? null)}
              buscar={(t) => api.categories({ search: t, perPage: 6 }).then((r) => r.data)}
              criar={(nome) => api.createCategory(nome)}
              dica="Opcional."
            />

            <div className="grade">
              <Campo id="editora" label="Editora" value={editora} onChange={setEditora} />
              <Campo id="ano" label="Ano de publicação" value={ano} onChange={setAno} />
            </div>

            <Campo id="sinopse" label="Sinopse" value={sinopse} onChange={setSinopse} />

            <div>
              <Btn type="submit" variant="acao" icone="check" loading={enviando}>
                Cadastrar obra
              </Btn>
            </div>
          </div>
        </Carta>
      </form>

      {criada ? <TombarDepois livro={criada} onFeito={onFeito} onTrava={onTrava} /> : null}
    </>
  );
}

/** Atalho logo após criar a obra: o próximo passo é sempre tombar o exemplar. */
function TombarDepois({
  livro,
  onFeito,
  onTrava,
}: {
  livro: Book;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  return (
    <Carta titulo={`Tombar exemplares de “${livro.title}”`} icone="pilha">
      <FormExemplar livroId={livro.id} onFeito={onFeito} onTrava={onTrava} />
    </Carta>
  );
}

/* ---------------------------------------------------------------- Estoque */

function Estoque({
  versao,
  onFeito,
  onTrava,
}: {
  versao: number;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [busca, setBusca] = useState('');
  const [livros, setLivros] = useState<Book[] | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    const t = setTimeout(() => {
      api
        .books({ search: busca.trim() || undefined, perPage: 12 })
        .then((r) => vivo && setLivros(r.data))
        .catch(() => vivo && setLivros([]));
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
  }, [busca, versao]);

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 5)' }}>
      <Carta>
        <Campo
          id="estoque-busca"
          label="Achar a obra"
          value={busca}
          onChange={setBusca}
          icone="busca"
          autoFocus
          dica="Título, autor, editora ou ISBN."
        />
      </Carta>

      <Carta titulo="Obras no catálogo" icone="acervo" padding={false}>
        {livros === null ? (
          <div style={{ padding: 'calc(var(--u) * 5)' }}>
            <Carregando linhas={3} />
          </div>
        ) : livros.length === 0 ? (
          <Vazio icone="acervo">
            Nenhuma obra encontrada. Cadastre a obra antes de tombar o exemplar.
          </Vazio>
        ) : (
          <ul className="lista">
            {livros.map((b) => (
              <li key={b.id} style={{ borderBottom: '1px solid var(--linha)' }}>
                <button
                  onClick={() => setAberto(aberto === b.id ? null : b.id)}
                  className="obra-linha"
                  aria-expanded={aberto === b.id}
                >
                  <span style={{ flex: '1 1 240px', minWidth: 0, textAlign: 'left' }}>
                    <strong style={{ display: 'block', fontSize: 15, letterSpacing: '-0.01em' }}>
                      {b.title}
                    </strong>
                    <span className="sub">{b.authors.map((a) => a.name).join(', ')}</span>
                  </span>
                  <Selo tom={b.totalCopies > 0 ? 'neutro' : 'alerta'}>
                    {b.totalCopies} {b.totalCopies === 1 ? 'exemplar' : 'exemplares'}
                  </Selo>
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

                {aberto === b.id ? (
                  <ExemplaresDaObra livroId={b.id} onFeito={onFeito} onTrava={onTrava} />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Carta>

      <style>{`
        .obra-linha {
          display: flex; align-items: center; gap: calc(var(--u) * 4);
          width: 100%; padding: calc(var(--u) * 4) calc(var(--u) * 5);
          background: transparent; border: 0; cursor: pointer;
          font: inherit; color: var(--tinta); flex-wrap: wrap;
          transition: background-color 0.14s ease;
        }
        .obra-linha:hover { background: var(--campo); }
      `}</style>
    </div>
  );
}

function ExemplaresDaObra({
  livroId,
  onFeito,
  onTrava,
}: {
  livroId: string;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [livro, setLivro] = useState<Book | null>(null);
  const [versao, setVersao] = useState(0);

  const carregar = useCallback(() => {
    setLivro(null);
    api
      .book(livroId)
      .then(setLivro)
      .catch(() => setLivro(null));
  }, [livroId]);

  useEffect(carregar, [carregar, versao]);

  return (
    <div className="gaveta surge">
      <FormExemplar
        livroId={livroId}
        onFeito={(t) => {
          onFeito(t);
          setVersao((v) => v + 1);
        }}
        onTrava={onTrava}
      />

      <div style={{ marginTop: 'calc(var(--u) * 5)', display: 'grid', gap: 'calc(var(--u) * 2)' }}>
        {!livro ? (
          <Carregando linhas={2} />
        ) : (livro.copies ?? []).length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>
            Nenhum exemplar tombado ainda. Enquanto não houver, a obra aparece no catálogo mas não
            pode ser emprestada.
          </p>
        ) : (
          (livro.copies ?? []).map((c) => (
            <LinhaExemplar
              key={c.id}
              copia={c}
              onFeito={(t) => {
                onFeito(t);
                setVersao((v) => v + 1);
              }}
              onTrava={onTrava}
            />
          ))
        )}
      </div>

      <style>{`
        .gaveta {
          padding: calc(var(--u) * 5);
          background: var(--campo);
          border-top: 1px solid var(--linha);
        }
      `}</style>
    </div>
  );
}

function LinhaExemplar({
  copia,
  onFeito,
  onTrava,
}: {
  copia: Copy;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [salvando, setSalvando] = useState(false);
  // Emprestado e reservado não se mexem por aqui: esse estado é do empréstimo,
  // e o servidor recusa a troca. Melhor não oferecer o que vai ser negado.
  const travado = copia.status === 'ON_LOAN' || copia.status === 'RESERVED';

  async function mudar(status: Exclude<CopyStatus, 'ON_LOAN' | 'RESERVED'>) {
    setSalvando(true);
    try {
      const c = await api.updateCopy(copia.id, { status });
      onFeito(`Exemplar ${c.code} agora está como ${rotuloStatus(status)}.`);
    } catch (err) {
      onTrava(msg(err));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="exemplar-linha">
      <span className="cod">{copia.code}</span>
      <span className="sub" style={{ flex: '1 1 120px' }}>
        {copia.shelf ? `estante ${copia.shelf}` : 'sem estante'}
      </span>
      <SituacaoSelo status={copia.status} />

      {travado ? (
        <span className="sub">em circulação</span>
      ) : (
        <span style={{ display: 'flex', gap: 'calc(var(--u) * 1.5)', flexWrap: 'wrap' }}>
          {copia.status !== 'AVAILABLE' ? (
            <Btn size="sm" icone="check" loading={salvando} onClick={() => mudar('AVAILABLE')}>
              Devolver à estante
            </Btn>
          ) : null}
          {copia.status !== 'MAINTENANCE' ? (
            <Btn size="sm" variant="fantasma" loading={salvando} onClick={() => mudar('MAINTENANCE')}>
              Manutenção
            </Btn>
          ) : null}
          {copia.status !== 'LOST' ? (
            <Btn size="sm" variant="trava" loading={salvando} onClick={() => mudar('LOST')}>
              Perdido
            </Btn>
          ) : null}
        </span>
      )}

      <style>{`
        .exemplar-linha {
          display: flex; align-items: center; gap: calc(var(--u) * 3);
          padding: calc(var(--u) * 3);
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: var(--r); flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}

function rotuloStatus(s: CopyStatus) {
  return { AVAILABLE: 'na estante', MAINTENANCE: 'em manutenção', LOST: 'perdido' }[
    s as 'AVAILABLE' | 'MAINTENANCE' | 'LOST'
  ];
}

function FormExemplar({
  livroId,
  onFeito,
  onTrava,
}: {
  livroId: string;
  onFeito: (t: string) => void;
  onTrava: (t: string) => void;
}) {
  const [code, setCode] = useState('');
  const [shelf, setShelf] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function tombar(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setEnviando(true);
    try {
      const c = await api.createCopy({
        bookId: livroId,
        code: code.trim(),
        ...(shelf.trim() ? { shelf: shelf.trim() } : {}),
      });
      onFeito(`Exemplar ${c.code} tombado e disponível na estante.`);
      setCode('');
    } catch (err) {
      onTrava(msg(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={tombar}
      style={{ display: 'flex', gap: 'calc(var(--u) * 3)', alignItems: 'flex-start', flexWrap: 'wrap' }}
    >
      <div style={{ flex: '1 1 200px' }}>
        <Campo
          id={`tombo-${livroId}`}
          label="Código de tombo"
          value={code}
          onChange={setCode}
          icone="bipar"
          dica="É o número que vai na etiqueta da lombada. Precisa ser único."
        />
      </div>
      <div style={{ flex: '0 1 160px' }}>
        <Campo id={`estante-${livroId}`} label="Estante" value={shelf} onChange={setShelf} />
      </div>
      <div style={{ paddingTop: 26 }}>
        <Btn type="submit" variant="acao" icone="pilha" loading={enviando}>
          Tombar exemplar
        </Btn>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------- Escolhedor */

/**
 * Busca-e-escolhe com criação embutida: catalogar uma obra sempre esbarra num
 * autor que ainda não existe, e mandar o funcionário sair da tela para criá-lo
 * é o que faz gente desistir do cadastro.
 */
function Escolhedor<T extends { id: string; name: string }>({
  rotulo,
  itens,
  onMuda,
  buscar,
  criar,
  multiplo,
  dica,
}: {
  rotulo: string;
  itens: T[];
  onMuda: (l: T[]) => void;
  buscar: (termo: string) => Promise<T[]>;
  criar: (nome: string) => Promise<T>;
  multiplo?: boolean;
  dica?: string;
}) {
  const [termo, setTermo] = useState('');
  const [achados, setAchados] = useState<T[]>([]);
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    const t = termo.trim();
    if (t.length < 2) {
      setAchados([]);
      return;
    }
    let vivo = true;
    const timer = setTimeout(() => {
      buscar(t)
        .then((r) => vivo && setAchados(r))
        .catch(() => vivo && setAchados([]));
    }, 250);
    return () => {
      vivo = false;
      clearTimeout(timer);
    };
  }, [termo]);

  const jaTem = (id: string) => itens.some((i) => i.id === id);

  function escolher(item: T) {
    onMuda(multiplo ? [...itens.filter((i) => i.id !== item.id), item] : [item]);
    setTermo('');
    setAchados([]);
  }

  async function criarNovo() {
    const nome = termo.trim();
    if (!nome) return;
    setCriando(true);
    try {
      escolher(await criar(nome));
    } catch {
      /* o servidor já explica; o campo continua aberto para nova tentativa */
    } finally {
      setCriando(false);
    }
  }

  const exato = achados.some((a) => a.name.toLowerCase() === termo.trim().toLowerCase());

  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 3)' }}>
      <Campo
        id={`escolhedor-${rotulo}`}
        label={rotulo}
        value={termo}
        onChange={setTermo}
        icone="busca"
        dica={dica}
      />

      {itens.length > 0 ? (
        <div style={{ display: 'flex', gap: 'calc(var(--u) * 2)', flexWrap: 'wrap' }}>
          {itens.map((i) => (
            <span key={i.id} className="ficha-escolhida">
              {i.name}
              <button
                type="button"
                onClick={() => onMuda(itens.filter((x) => x.id !== i.id))}
                aria-label={`Tirar ${i.name}`}
                className="toque"
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: 'inherit',
                  display: 'inline-flex',
                  padding: 0,
                }}
              >
                <Icon name="x" size={13} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {achados.filter((a) => !jaTem(a.id)).length > 0 ? (
        <div style={{ display: 'grid', gap: 'calc(var(--u) * 1.5)' }}>
          {achados
            .filter((a) => !jaTem(a.id))
            .map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => escolher(a)}
                className="toque sugestao"
              >
                {a.name}
              </button>
            ))}
        </div>
      ) : null}

      {termo.trim().length >= 2 && !exato ? (
        <div>
          <Btn size="sm" icone="check" loading={criando} onClick={criarNovo}>
            Criar “{termo.trim()}”
          </Btn>
        </div>
      ) : null}

      <style>{`
        .ficha-escolhida {
          display: inline-flex; align-items: center; gap: calc(var(--u) * 2);
          padding: calc(var(--u) * 1.5) calc(var(--u) * 3);
          background: var(--acao-fraca); color: var(--acao-tinta);
          border-radius: 999px; font-size: 13.5px; font-weight: 700;
        }
        .sugestao {
          text-align: left; padding: calc(var(--u) * 2.5) calc(var(--u) * 3.5);
          background: var(--papel); border: 1px solid var(--linha);
          border-radius: var(--r); cursor: pointer; font: inherit;
          color: var(--tinta);
        }
        .sugestao:hover { border-color: var(--acao); background: var(--acao-fraca); }
      `}</style>
    </div>
  );
}
