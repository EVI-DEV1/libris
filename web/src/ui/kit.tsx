import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { PixelIcon } from './PixelIcon';
import type { IconName } from './PixelIcon';

/* ------------------------------------------------------------------ Janela */

export function Win({
  title,
  icon,
  right,
  children,
  flat,
  style,
}: {
  title?: string;
  icon?: IconName;
  right?: ReactNode;
  children: ReactNode;
  flat?: boolean;
  style?: CSSProperties;
}) {
  return (
    <section className={flat ? 'win-flat' : 'win'} style={style}>
      {title ? (
        <header className="win-title">
          {icon ? <PixelIcon name={icon} size={14} /> : null}
          <span style={{ flex: 1 }}>{title}</span>
          {right}
        </header>
      ) : null}
      <div style={{ padding: 'calc(var(--u) * 4)' }}>{children}</div>
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
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: 'calc(var(--u) * 2.5) calc(var(--u) * 3.5)',
    border: 'var(--border) solid var(--ink)',
    borderRadius: 'var(--radius)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'calc(var(--u) * 2)',
    cursor: off ? 'not-allowed' : 'pointer',
    width: full ? '100%' : undefined,
    transition: 'transform 90ms steps(2, end), box-shadow 90ms steps(2, end)',
  };

  const skin: CSSProperties =
    variant === 'primary'
      ? { background: 'var(--ink)', color: 'var(--pale)', boxShadow: '0 3px 0 0 var(--shade)' }
      : variant === 'danger'
        ? {
            background: 'var(--pale)',
            color: 'var(--ink)',
            borderColor: 'var(--lamp)',
            boxShadow: '0 3px 0 0 var(--lamp)',
          }
        : { background: 'var(--pale)', color: 'var(--ink)', boxShadow: '0 3px 0 0 var(--shade)' };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={off}
      style={{ ...base, ...skin, opacity: off ? 0.45 : 1 }}
      onMouseDown={(e) => {
        if (!off) e.currentTarget.style.transform = 'translateY(3px)';
      }}
      onMouseUp={(e) => (e.currentTarget.style.transform = '')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = '')}
    >
      {loading ? (
        <span className="blink" aria-hidden>
          ·
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
          fontSize: 17,
          color: 'var(--ink)',
          background: 'var(--pale)',
          border: 'var(--border) solid var(--ink)',
          borderRadius: 'var(--radius)',
          padding: 'calc(var(--u) * 2.5) calc(var(--u) * 3)',
          caretColor: 'var(--ink)',
        }}
      />
      {hint || exemplo ? (
        <span className="label" style={{ display: 'block', marginTop: 'calc(var(--u) * 1.5)' }}>
          {exemplo ? <>Ex.: {exemplo}{hint ? ' · ' : ''}</> : null}
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
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontFamily: 'var(--font-chrome)' }}
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
 * Estado se marca por inversão e por caixa — a cor não muda.
 * `onDark` existe porque tinta sobre tinta dá contraste 1:1: dentro do
 * cabeçalho invertido a etiqueta precisa virar do avesso para existir.
 */
export function Tag({
  children,
  strong,
  alarm,
  onDark,
}: {
  children: ReactNode;
  strong?: boolean;
  alarm?: boolean;
  onDark?: boolean;
}) {
  if (onDark) {
    return (
      <span
        style={{
          fontFamily: 'var(--font-chrome)',
          fontSize: 10,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          padding: '3px 6px',
          border: `2px solid ${alarm ? 'var(--lamp)' : 'var(--pale)'}`,
          borderRadius: 3,
          background: strong ? 'var(--pale)' : 'transparent',
          color: strong ? 'var(--ink)' : 'var(--pale)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {alarm ? <PixelIcon name="lampada" size={7} color="var(--lamp)" /> : null}
        {children}
      </span>
    );
  }

  return (
    <span
      style={{
        fontFamily: 'var(--font-chrome)',
        fontSize: 10,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        padding: '3px 6px',
        border: `2px solid ${alarm ? 'var(--lamp)' : 'var(--ink)'}`,
        borderRadius: 3,
        background: strong ? 'var(--ink)' : 'transparent',
        color: strong ? 'var(--pale)' : 'var(--ink)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}
    >
      {alarm ? <PixelIcon name="lampada" size={7} color="var(--lamp)" /> : null}
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
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            color: 'inherit',
            padding: 2,
          }}
        >
          <PixelIcon name="x" size={12} />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------ Vazio / carga */

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: 'calc(var(--u) * 8) calc(var(--u) * 4)',
        textAlign: 'center',
        border: '3px dashed var(--shade)',
        borderRadius: 'var(--radius)',
      }}
    >
      <p className="label" style={{ margin: 0 }}>
        {children}
      </p>
    </div>
  );
}

export function Carregando({ children = 'Carregando' }: { children?: ReactNode }) {
  return (
    <p className="label" style={{ padding: 'calc(var(--u) * 6)', textAlign: 'center' }}>
      {children}
      <span className="blink">_</span>
    </p>
  );
}

/** A seta que sempre marca qual é o próximo passo. */
export function Proximo() {
  return (
    <span className="blink" style={{ display: 'inline-block' }}>
      <PixelIcon name="seta" size={12} />
    </span>
  );
}
