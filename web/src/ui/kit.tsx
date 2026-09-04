import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';

/* ---------------------------------------------------------------- Superfície */

export function Carta({
  titulo,
  icone,
  direita,
  children,
  padding = true,
  style,
}: {
  titulo?: string;
  icone?: IconName;
  direita?: ReactNode;
  children: ReactNode;
  padding?: boolean;
  style?: CSSProperties;
}) {
  return (
    <section className="carta" style={style}>
      {titulo ? (
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--u) * 2.5)',
            padding: 'calc(var(--u) * 4) calc(var(--u) * 5)',
            borderBottom: '1px solid var(--linha)',
          }}
        >
          {icone ? (
            <span style={{ color: 'var(--tinta-3)' }}>
              <Icon name={icone} size={18} />
            </span>
          ) : null}
          <h2 style={{ flex: 1, fontSize: 15, letterSpacing: '-0.01em' }}>{titulo}</h2>
          {direita}
        </header>
      ) : null}
      <div style={padding ? { padding: 'calc(var(--u) * 5)' } : undefined}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------- Botão */

export function Btn({
  children,
  onClick,
  variant = 'suave',
  icone,
  disabled,
  loading,
  type = 'button',
  full,
  size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'acao' | 'suave' | 'fantasma' | 'trava';
  icone?: IconName;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  full?: boolean;
  size?: 'sm' | 'md';
}) {
  const off = disabled || loading;

  const base: CSSProperties = {
    fontFamily: 'inherit',
    fontSize: size === 'sm' ? 13 : 14,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    padding:
      size === 'sm'
        ? 'calc(var(--u) * 2) calc(var(--u) * 3)'
        : 'calc(var(--u) * 2.75) calc(var(--u) * 4.5)',
    borderRadius: 'var(--r)',
    border: '1px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'calc(var(--u) * 2)',
    cursor: off ? 'not-allowed' : 'pointer',
    width: full ? '100%' : undefined,
    opacity: off ? 0.5 : 1,
    whiteSpace: 'nowrap',
  };

  const pele: Record<string, CSSProperties> = {
    // A ação primária é a única superfície de cobalto cheio da tela.
    acao: {
      background: 'var(--acao)',
      color: '#fff',
      boxShadow: off ? 'none' : 'var(--sombra-acao)',
    },
    suave: {
      background: 'var(--papel)',
      color: 'var(--tinta)',
      borderColor: 'var(--linha)',
      boxShadow: 'var(--sombra-1)',
    },
    fantasma: { background: 'transparent', color: 'var(--tinta-2)' },
    trava: { background: 'var(--trava-fraca)', color: 'var(--trava)' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={off}
      className="toque"
      style={{ ...base, ...pele[variant] }}
    >
      {loading ? <Girando /> : icone ? <Icon name={icone} size={size === 'sm' ? 15 : 17} /> : null}
      {children}
    </button>
  );
}

function Girando() {
  return (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        animation: 'girar 0.7s linear infinite',
        display: 'block',
      }}
    >
      <style>{`@keyframes girar { to { transform: rotate(360deg) } }`}</style>
    </span>
  );
}

/* -------------------------------------------------------------------- Campo */

export function Campo({
  label,
  value,
  onChange,
  dica,
  type = 'text',
  autoFocus,
  id,
  icone,
  grande,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dica?: string;
  type?: string;
  autoFocus?: boolean;
  id: string;
  icone?: IconName;
  grande?: boolean;
}) {
  const [focado, setFocado] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="rotulo"
        style={{ display: 'block', marginBottom: 'calc(var(--u) * 2)' }}
      >
        {label}
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icone ? (
          <span
            style={{
              position: 'absolute',
              left: 'calc(var(--u) * 3.5)',
              color: focado ? 'var(--acao)' : 'var(--tinta-3)',
              transition: 'color 0.16s ease',
              pointerEvents: 'none',
            }}
          >
            <Icon name={icone} size={grande ? 20 : 18} />
          </span>
        ) : null}

        <input
          id={id}
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          className="toque"
          style={{
            width: '100%',
            fontFamily: grande ? 'var(--mono)' : 'inherit',
            fontSize: grande ? 20 : 15,
            fontWeight: grande ? 500 : 400,
            letterSpacing: grande ? '0.02em' : undefined,
            color: 'var(--tinta)',
            background: 'var(--papel)',
            border: `1px solid ${focado ? 'var(--acao)' : 'var(--linha)'}`,
            borderRadius: 'var(--r)',
            padding: `${grande ? 'calc(var(--u) * 3.5)' : 'calc(var(--u) * 2.75)'} calc(var(--u) * 3.5)`,
            paddingLeft: icone ? 'calc(var(--u) * 11)' : undefined,
            boxShadow: focado ? '0 0 0 4px rgba(47, 87, 255, 0.12)' : 'var(--sombra-1)',
            outline: 'none',
          }}
        />
      </div>

      {dica ? (
        <p className="sub" style={{ margin: 'calc(var(--u) * 2) 0 0' }}>
          {dica}
        </p>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------- Contador */

/**
 * Contador de casas fixas: cada dígito mora numa célula que não se move, e a
 * troca acende a célula por um instante. O número nunca é redesenhado inteiro.
 */
export function Contador({
  value,
  casas,
  cor,
}: {
  value: number;
  casas?: number;
  cor?: string;
}) {
  const texto = String(Math.abs(Math.trunc(value)));
  const digitos = (casas ? texto.padStart(casas, '0') : texto).split('');
  const anterior = useRef(digitos);
  const [aceso, setAceso] = useState<number[]>([]);

  useEffect(() => {
    const mudou: number[] = [];
    digitos.forEach((d, i) => {
      if (anterior.current[i] !== d) mudou.push(i);
    });
    anterior.current = digitos;
    if (mudou.length) {
      setAceso(mudou);
      const t = setTimeout(() => setAceso([]), 420);
      return () => clearTimeout(t);
    }
    return;
  }, [digitos.join('')]);

  return (
    <span style={{ display: 'inline-flex', fontFamily: 'var(--mono)', fontWeight: 600 }}>
      {digitos.map((d, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            textAlign: 'center',
            minWidth: '0.62em',
            color: aceso.includes(i) ? 'var(--acao)' : (cor ?? 'inherit'),
            transform: aceso.includes(i) ? 'translateY(-1px)' : 'none',
            transition: 'color 0.35s var(--saida), transform 0.35s var(--saida)',
          }}
        >
          {d}
        </span>
      ))}
    </span>
  );
}

/* --------------------------------------------------------------- Etiquetas */

export type Tom = 'ok' | 'neutro' | 'espera' | 'alerta' | 'trava';

const TONS: Record<Tom, CSSProperties> = {
  ok: { background: 'var(--ok-fraca)', color: 'var(--ok)' },
  neutro: { background: 'var(--campo-2)', color: 'var(--tinta-2)' },
  espera: { background: 'var(--acao-fraca)', color: 'var(--acao-tinta)' },
  alerta: { background: 'var(--alerta-fraca)', color: 'var(--alerta)' },
  trava: { background: 'var(--trava-fraca)', color: 'var(--trava)' },
};

/** Estado se marca por campo de cor cheio, cada tom com um significado só. */
export function Selo({
  children,
  tom = 'neutro',
  ponto,
}: {
  children: ReactNode;
  tom?: Tom;
  ponto?: boolean;
}) {
  return (
    <span
      style={{
        ...TONS[tom],
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '-0.005em',
        padding: 'calc(var(--u) * 1.25) calc(var(--u) * 2.5)',
        borderRadius: 999,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'calc(var(--u) * 1.5)',
        whiteSpace: 'nowrap',
      }}
    >
      {ponto ? (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            flex: 'none',
          }}
        />
      ) : null}
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Recados */

/**
 * A recusa é parte do atendimento: ganha a mesma caixa que o sucesso, e mostra
 * a frase que o SERVIDOR deu — a tela não reescreve regra de negócio.
 */
export function Recado({
  tipo,
  children,
  onFechar,
}: {
  tipo: 'ok' | 'trava' | 'aviso';
  children: ReactNode;
  onFechar?: () => void;
}) {
  const skin =
    tipo === 'ok'
      ? { fundo: 'var(--ok-fraca)', tinta: 'var(--ok)', icone: 'check' as IconName }
      : tipo === 'trava'
        ? { fundo: 'var(--trava-fraca)', tinta: 'var(--trava)', icone: 'alerta' as IconName }
        : { fundo: 'var(--alerta-fraca)', tinta: 'var(--alerta)', icone: 'alerta' as IconName };

  return (
    <div
      role={tipo === 'trava' ? 'alert' : 'status'}
      className="surge"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'calc(var(--u) * 3)',
        padding: 'calc(var(--u) * 3.5) calc(var(--u) * 4)',
        borderRadius: 'var(--r)',
        background: skin.fundo,
        color: 'var(--tinta)',
      }}
    >
      <span style={{ color: skin.tinta, paddingTop: 1 }}>
        <Icon name={skin.icone} size={19} />
      </span>
      <div style={{ flex: 1, fontSize: 14.5 }}>{children}</div>
      {onFechar ? (
        <button
          onClick={onFechar}
          aria-label="Fechar recado"
          className="toque"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: 'var(--tinta-3)',
            padding: 2,
            display: 'inline-flex',
            borderRadius: 6,
          }}
        >
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- Vazio / carga */

export function Vazio({ children, icone = 'acervo' }: { children: ReactNode; icone?: IconName }) {
  return (
    <div
      style={{
        padding: 'calc(var(--u) * 12) calc(var(--u) * 5)',
        textAlign: 'center',
        display: 'grid',
        placeItems: 'center',
        gap: 'calc(var(--u) * 3)',
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--r-g)',
          background: 'var(--campo-2)',
          color: 'var(--tinta-3)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Icon name={icone} size={24} />
      </span>
      <p className="sub" style={{ margin: 0, maxWidth: '34ch' }}>
        {children}
      </p>
    </div>
  );
}

/** Esqueleto: o formato da resposta antes dela chegar, para a tela não pular. */
export function Carregando({ linhas = 3 }: { linhas?: number }) {
  return (
    <div style={{ display: 'grid', gap: 'calc(var(--u) * 2)' }} aria-busy="true" aria-live="polite">
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 56,
            borderRadius: 'var(--r)',
            background:
              'linear-gradient(90deg, var(--campo-2) 25%, var(--campo) 37%, var(--campo-2) 63%)',
            backgroundSize: '400% 100%',
            animation: 'desliza 1.3s ease infinite',
          }}
        />
      ))}
      <style>{`@keyframes desliza { 0% { background-position: 100% 50% } 100% { background-position: 0 50% } }`}</style>
    </div>
  );
}
