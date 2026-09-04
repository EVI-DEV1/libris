import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';
import type { IconName } from './PixelIcon';

/* ------------------------------------------------------------------ Janela */

/**
 * O cabeçalho é tinta chapada SOB o texto e xadrez no resto da faixa.
 * O dither não pode passar por baixo de letra: pálido sobre o tom médio dá
 * 3.29:1. Ele é campo onde não há texto — é assim que o quinto tom vira
 * material de verdade sem custar legibilidade.
 */
export function Win({
  title,
  icon,
  right,
  children,
  flat,
  grow,
  style,
}: {
  title?: string;
  icon?: IconName;
  right?: ReactNode;
  children: ReactNode;
  flat?: boolean;
  /** Faz a janela ocupar a altura que sobra, em vez de flutuar sobre o vazio. */
  grow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <section
      className={flat ? 'win-flat' : 'win'}
      style={{
        ...(grow ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}),
        ...style,
      }}
    >
      {title ? (
        <header className="win-title" style={{ background: 'var(--ink)' }}>
          {icon ? <PixelIcon name={icon} size={14} /> : null}
          <span>{title}</span>
          {/* Trecho de xadrez: o terminador da faixa, sem letra nenhuma em cima. */}
          <span
            className="dither"
            aria-hidden
            style={{ flex: 1, alignSelf: 'stretch', margin: '0 calc(var(--u) * 2)', minWidth: 24 }}
          />
          {right}
        </header>
      ) : null}
      <div
        style={{
          padding: 'calc(var(--u) * 4)',
          ...(grow ? { flex: 1, minHeight: 0, overflowY: 'auto' } : {}),
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- Botão */

export function Btn({
  children,
  onClick,
  variant = 'ghost',
  icon,
  disabled,
  loading,
  type = 'button',
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  full?: boolean;
}) {
  const off = disabled || loading;
  const base: CSSProperties = {
    fontFamily: 'var(--font-chrome)',
    fontSize: 'var(--t-chrome)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: 'calc(var(--u) * 3) calc(var(--u) * 4)',
    border: 'var(--border) solid var(--ink)',
    borderRadius: 'var(--radius)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'calc(var(--u) * 2)',
    cursor: off ? 'not-allowed' : 'pointer',
    width: full ? '100%' : undefined,
  };

  // Camada de bloco E camada com borrão — sombra sem desfoque é costume, não
  // sistema de profundidade.
  const sombra = (cor: string) => `0 3px 0 0 ${cor}, 0 5px 8px -4px rgba(15, 56, 15, 0.4)`;

  const skin: CSSProperties =
    variant === 'primary'
      ? { background: 'var(--ink)', color: 'var(--pale)', boxShadow: sombra('var(--shade)') }
      : variant === 'danger'
        ? {
            background: 'var(--pale)',
            color: 'var(--ink)',
            borderColor: 'var(--lamp)',
            boxShadow: sombra('var(--lamp)'),
          }
        : { background: 'var(--pale)', color: 'var(--ink)', boxShadow: sombra('var(--shade)') };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={off}
      /* O afundar mora no CSS (:active), não em mousedown: leitor de código de
         barras é teclado e celular é toque — nenhum dos dois emite mouse. */
      className="bloco"
      style={{ ...base, ...skin, opacity: off ? 0.45 : 1 }}
    >
      {loading ? (
        <span className="blink" style={{ display: 'flex' }} aria-hidden>
          <PixelIcon name="lampada" size={11} />
        </span>
      ) : icon ? (
        <PixelIcon name={icon} size={13} />
      ) : null}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- Campo */

export function Field({
  label,
  value,
  onChange,
  exemplo,
  type = 'text',
  autoFocus,
  hint,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  exemplo?: string;
  type?: string;
  autoFocus?: boolean;
  hint?: string;
  id: string;
}) {
  return (
    <label htmlFor={id} style={{ display: 'block' }}>
      <span className="label" style={{ display: 'block', marginBottom: 'calc(var(--u) * 1.5)' }}>
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          font: 'inherit',
          fontSize: 'var(--t-corpo)',
          color: 'var(--ink)',
          background: 'var(--pale)',
          border: 'var(--border) solid var(--ink)',
          borderRadius: 'var(--radius)',
          padding: 'calc(var(--u) * 3)',
          caretColor: 'var(--ink)',
        }}
      />
      {hint || exemplo ? (
        <span className="dado" style={{ display: 'block', marginTop: 'calc(var(--u) * 1.5)' }}>
          {exemplo ? (
            <>
              Ex.: {exemplo}
              {hint ? ' · ' : ''}
            </>
          ) : null}
          {hint}
        </span>
      ) : null}
    </label>
  );
}

/* ---------------------------------------------------------------- Contador */

/**
 * Contador de casas fixas: cada dígito mora numa célula que não se move, e a
 * troca acende a célula por um instante. O número nunca é redesenhado inteiro.
 */
export function Counter({
  value,
  places,
  prefix,
  suffix,
  alarm,
}: {
  value: number;
  places?: number;
  prefix?: string;
  suffix?: string;
  alarm?: boolean;
}) {
  const text = String(Math.abs(Math.trunc(value)));
  const digits = (places ? text.padStart(places, '0') : text).split('');
  const prev = useRef(digits);
  const [flash, setFlash] = useState<number[]>([]);

  useEffect(() => {
    const changed: number[] = [];
    digits.forEach((d, i) => {
      if (prev.current[i] !== d) changed.push(i);
    });
    prev.current = digits;
    if (changed.length) {
      setFlash(changed);
      const t = setTimeout(() => setFlash([]), 260);
      return () => clearTimeout(t);
    }
    return;
  }, [digits.join('')]);

  return (
    <span
      className="num"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontFamily: 'var(--font-chrome)',
      }}
    >
      {prefix ? <span style={{ marginRight: 2 }}>{prefix}</span> : null}
      {digits.map((d, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            minWidth: '0.72em',
            textAlign: 'center',
            padding: '1px 2px',
            background: flash.includes(i) ? 'var(--ink)' : 'transparent',
            color: flash.includes(i) ? 'var(--pale)' : 'inherit',
          }}
        >
          {d}
        </span>
      ))}
      {suffix ? <span style={{ marginLeft: 3 }}>{suffix}</span> : null}
      {alarm ? <Lamp /> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ Lâmpada */

/** A única coisa vermelha da interface. Ponto, nunca texto. */
export function Lamp({ label }: { label?: string }) {
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 'calc(var(--u) * 1.5)' }}
      title={label}
    >
      <span className="blink" style={{ display: 'block' }}>
        <PixelIcon name="lampada" size={9} color="var(--lamp)" title={label} />
      </span>
    </span>
  );
}

/* -------------------------------------------------------------- Etiquetas */

/**
 * Estado se marca por INVERSÃO e por caixa — a cor não muda.
 * Três pesos, porque o balcão precisa distinguir os estados de relance:
 *  - `strong`   invertido: o estado que libera ação (na estante, no prazo);
 *  - padrão     contorno: o estado neutro em curso (emprestado);
 *  - `dashed`   tracejado: estado de espera, que não é ação nem alarme;
 *  - `alarm`    borda da lâmpada: o que trava o atendimento.
 */
export function Tag({
  children,
  strong,
  alarm,
  dashed,
  onDark,
}: {
  children: ReactNode;
  strong?: boolean;
  alarm?: boolean;
  dashed?: boolean;
  onDark?: boolean;
}) {
  const tinta = onDark ? 'var(--pale)' : 'var(--ink)';
  const fundo = onDark ? 'var(--ink)' : 'var(--pale)';

  return (
    <span
      style={{
        fontFamily: 'var(--font-chrome)',
        fontSize: 'var(--t-chrome)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        border: `2px ${dashed ? 'dashed' : 'solid'} ${alarm ? 'var(--lamp)' : tinta}`,
        borderRadius: 3,
        background: strong ? tinta : 'transparent',
        color: strong ? fundo : tinta,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {alarm ? <PixelIcon name="lampada" size={8} color="var(--lamp)" /> : null}
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- Recados */

/**
 * A recusa é parte do atendimento: ela ganha a mesma caixa que o sucesso, e
 * mostra a frase que o SERVIDOR deu — a tela não reescreve regra de negócio.
 */
export function Recado({
  kind,
  children,
  onClose,
}: {
  kind: 'ok' | 'bloqueio' | 'aviso';
  children: ReactNode;
  onClose?: () => void;
}) {
  const alarm = kind === 'bloqueio';
  return (
    <div
      role={alarm ? 'alert' : 'status'}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'calc(var(--u) * 3)',
        padding: 'calc(var(--u) * 3)',
        border: `var(--border) solid ${alarm ? 'var(--lamp)' : 'var(--ink)'}`,
        borderRadius: 'var(--radius)',
        background: kind === 'ok' ? 'var(--ink)' : 'var(--pale)',
        color: kind === 'ok' ? 'var(--pale)' : 'var(--ink)',
      }}
    >
      <span style={{ paddingTop: 3 }}>
        <PixelIcon
          name={kind === 'ok' ? 'check' : 'alerta'}
          size={14}
          color={alarm ? 'var(--lamp)' : 'currentColor'}
        />
      </span>
      <div style={{ flex: 1 }}>{children}</div>
      {onClose ? (
        <button
          onClick={onClose}
          aria-label="Fechar recado"
          className="bloco"
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: 'inherit',
            padding: 2,
            display: 'inline-flex',
          }}
        >
          <PixelIcon name="x" size={12} />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Vazio / carga */

/**
 * O vazio é um campo de xadrez com uma placa em cima — não um retângulo
 * tracejado. O texto fica na placa sólida, porque tinta sobre o tom médio dá
 * 1.83:1 e seria ilegível direto no xadrez.
 */
export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div
      className="dither-fine"
      style={{
        padding: 'calc(var(--u) * 8) calc(var(--u) * 4)',
        borderRadius: 'var(--radius)',
        border: '2px solid var(--shade)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <p
        className="label"
        style={{
          margin: 0,
          background: 'var(--pale)',
          border: '2px solid var(--ink)',
          borderRadius: 4,
          padding: 'calc(var(--u) * 2) calc(var(--u) * 3)',
          textAlign: 'center',
        }}
      >
        {children}
      </p>
    </div>
  );
}

export function Carregando({ children = 'Carregando' }: { children?: ReactNode }) {
  return (
    <p
      className="label"
      style={{
        padding: 'calc(var(--u) * 6)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'calc(var(--u) * 2)',
      }}
    >
      {children}
      <span className="blink" style={{ display: 'flex' }} aria-hidden>
        <PixelIcon name="lampada" size={10} />
      </span>
    </p>
  );
}

/** A seta que sempre marca qual é o próximo passo. */
export function Proximo() {
  return (
    <span className="blink" style={{ display: 'inline-flex' }}>
      <PixelIcon name="seta" size={12} />
    </span>
  );
}
