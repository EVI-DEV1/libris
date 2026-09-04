/**
 * Sistema de ícones desenhado: grade de 24, traço de 1.75, ponta e junta
 * arredondadas, tudo no mesmo peso. Nada de emoji nem glifo unicode fazendo
 * as vezes de ícone.
 */

const PATHS = {
  /* Leitura de código — o gesto de abrir o atendimento. */
  bipar: (
    <>
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M4 12h16" />
    </>
  ),
  acervo: (
    <>
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H9v16H6.5A1.5 1.5 0 0 1 5 18.5z" />
      <path d="M9 4h3.5A1.5 1.5 0 0 1 14 5.5v13a1.5 1.5 0 0 1-1.5 1.5H9z" />
      <path d="m16.2 5.6 2.4-.6a1 1 0 0 1 1.2.7l2.1 12.1" />
    </>
  ),
  pilha: (
    <>
      <path d="M12 3 3 7.5l9 4.5 9-4.5z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
      <path d="m3 17 9 4.5L21 17" />
    </>
  ),
  reserva: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  busca: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  seta: <path d="M5 12h13m-5.5-5.5L18 12l-5.5 5.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  alerta: (
    <>
      <path d="M12 4.5 2.8 20h18.4z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.4" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  ponto: <circle cx="12" cy="12" r="5" fill="currentColor" stroke="none" />,
  sair: (
    <>
      <path d="M15 5.5V4.8A1.8 1.8 0 0 0 13.2 3H5.8A1.8 1.8 0 0 0 4 4.8v14.4A1.8 1.8 0 0 0 5.8 21h7.4a1.8 1.8 0 0 0 1.8-1.8v-.7" />
      <path d="M10 12h11m-4-4 4 4-4 4" />
    </>
  ),
  /* Sai da estante para a mão do leitor. */
  emprestar: (
    <>
      <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" />
      <path d="M12 15V4m-4.5 4.5L12 4l4.5 4.5" />
    </>
  ),
  /* Volta da mão do leitor para a estante. */
  devolver: (
    <>
      <path d="M4 14v4.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V14" />
      <path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5" />
    </>
  ),
  usuario: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </>
  ),
  estante: (
    <>
      <path d="M3.5 4.5h17v15h-17z" />
      <path d="M3.5 12h17M9 4.5v7.5M15 12v7.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  title,
  strokeWidth = 1.75,
}: {
  name: IconName;
  size?: number;
  title?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', flex: 'none' }}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}
