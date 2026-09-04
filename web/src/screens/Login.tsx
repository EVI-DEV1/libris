import { useState } from 'react';
import { api, ApiError, token } from '../api/client';
import type { User } from '../api/types';
import { brand } from '../brand';
import { irPara } from '../rota';
import type { Porta } from '../rota';
import { Icon } from '../ui/Icon';
import { Btn, Campo, Recado } from '../ui/kit';

/**
 * Duas portas, um único `POST /auth/login`.
 *
 * A separação é de acesso, não de autenticação: cada porta diz de quem ela é,
 * e recusa quem não é — com o nome do papel na recusa, para a pessoa saber
 * para onde ir em vez de ficar tentando a mesma senha.
 */
export function Login({ porta, onEntrar }: { porta: Porta; onEntrar: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [esqueci, setEsqueci] = useState(false);

  const direcao = porta === 'direcao';

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await api.login(email, senha);

      if (direcao && r.user.role !== 'ADMIN') {
        setErro(
          r.user.role === 'LIBRARIAN'
            ? 'Esta entrada é da direção. Sua conta é de funcionário — use a entrada dos funcionários, no rodapé.'
            : 'Esta entrada é da direção. Contas de leitor não têm acesso ao sistema.',
        );
        return;
      }
      if (!direcao && r.user.role === 'MEMBER') {
        setErro('Esta tela é do balcão. Contas de leitor ainda não têm acesso.');
        return;
      }

      token.set(r.token);
      onEntrar(r.user);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não consegui entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main className="entrada">
      <div className="entrada-caixa surge">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--u) * 3)' }}>
          <span className={`entrada-selo ${direcao ? 'selo-direcao' : ''}`} aria-hidden>
            <Icon name={direcao ? 'chave' : 'acervo'} size={26} />
          </span>

        </div>

        <div>
          <h1 style={{ fontSize: 28 }}>{direcao ? 'Direção' : brand.name}</h1>
          <p className="sub" style={{ margin: 'calc(var(--u) * 1) 0 0', fontSize: 15 }}>
            {direcao
              ? `Acesso restrito à administração do ${brand.name}: acervo, estoque e pessoas.`
              : brand.tagline}
          </p>
        </div>

        <form onSubmit={entrar} style={{ display: 'grid', gap: 'calc(var(--u) * 4)' }}>
          <Campo
            id="email"
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            autoFocus
          />
          <Campo id="senha" label="Senha" type="password" value={senha} onChange={setSenha} />

          {erro ? <Recado tipo="trava">{erro}</Recado> : null}

          {esqueci ? (
            <Recado tipo="aviso" onFechar={() => setEsqueci(false)}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Quem devolve seu acesso é a direção.</strong>
              Peça para a direção resetar sua senha em <em>Equipe</em>. Sua conta volta para a senha
              padrão da casa, e o sistema pede uma senha nova assim que você entrar.
              <br />
              <span className="sub" style={{ display: 'block', marginTop: 6 }}>
                Ainda não há redefinição por e-mail: isso depende de um serviço de envio que este
                sistema não tem.
              </span>
            </Recado>
          ) : null}

          <Btn type="submit" variant="acao" loading={enviando} full icone="seta">
            {enviando ? 'Entrando' : direcao ? 'Entrar na direção' : 'Entrar'}
          </Btn>

          <button
            type="button"
            className="toque esqueci"
            onClick={() => setEsqueci((v) => !v)}
            aria-expanded={esqueci}
          >
            Esqueci minha senha
          </button>
        </form>

        <div className="pe">
          <button
            type="button"
            className="toque porta-outra"
            onClick={() => {
              setErro(null);
              irPara(direcao ? 'funcionarios' : 'direcao');
            }}
          >
            <Icon name={direcao ? 'bipar' : 'chave'} size={15} />
            {direcao ? 'Entrada dos funcionários' : 'Entrada da direção'}
          </button>

          <p className="sub" style={{ margin: 0, fontSize: 12.5 }}>
            Demonstração ·{' '}
            {direcao ? 'admin@biblioteca.dev' : 'balcao@biblioteca.dev'} · admin12345
          </p>
        </div>
      </div>

      <style>{`
        .entrada {
          min-height: 100dvh;
          display: grid;
          place-items: center;
          padding: calc(var(--u) * 6);
          background: var(--fundo);
          background-attachment: fixed;
        }
        .entrada-caixa {
          width: min(410px, 100%);
          display: grid;
          gap: calc(var(--u) * 6);
          background: var(--papel);
          border: 1px solid var(--linha);
          border-radius: 20px;
          padding: calc(var(--u) * 9) calc(var(--u) * 8);
          box-shadow: var(--sombra-3);
        }
        .entrada-selo {
          width: 52px; height: 52px;
          border-radius: 15px;
          background-image: var(--gradiente-forte);
          color: #fff;
          display: grid; place-items: center;
          box-shadow: var(--sombra-acao);
        }
        /* A porta da direção usa a ponta vinho do mesmo gradiente, chapada: é a
           mesma família, e mesmo assim ninguém confunde as duas portas. */
        .selo-direcao {
          background-image: none;
          background-color: var(--g-b-forte);
          box-shadow: 0 2px 4px rgba(203, 48, 102, 0.22),
                      0 12px 28px -8px rgba(203, 48, 102, 0.45);
        }
        .pe {
          display: grid; gap: calc(var(--u) * 3); justify-items: center;
          padding-top: calc(var(--u) * 2);
          border-top: 1px solid var(--linha);
        }
        .porta-outra {
          display: inline-flex; align-items: center; gap: calc(var(--u) * 2);
          background: transparent; border: 0; cursor: pointer;
          font: inherit; font-size: 13.5px; font-weight: 700;
          color: var(--acao); padding: calc(var(--u) * 1.5) calc(var(--u) * 2);
          border-radius: var(--r);
        }
        .porta-outra:hover { background: var(--acao-fraca); }
        .esqueci {
          background: transparent; border: 0; cursor: pointer;
          font: inherit; font-size: 13.5px; font-weight: 600;
          color: var(--tinta-2); text-decoration: underline;
          text-underline-offset: 3px; justify-self: center;
          padding: calc(var(--u) * 1) calc(var(--u) * 2); border-radius: var(--r);
        }
        .esqueci:hover { color: var(--acao); }
      `}</style>
    </main>
  );
}
