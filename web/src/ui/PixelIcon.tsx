/**
 * Sistema de ícones desenhado na grade de 8×8 — a mesma grade do resto da tela.
 * Nada de emoji nem glifo unicode fazendo as vezes de ícone: cada um é um mapa
 * de pixels, renderizado como retângulos com bordas duras.
 */

const MAPS = {
  acervo: [
    "........",
    "..#.....",
    ".###..#.",
    ".###.##.",
    ".###.##.",
    ".###.##.",
    "########",
    "........",
  ],
  balcao: [
    "........",
    "..####..",
    "..#..#..",
    "########",
    "##....##",
    "##....##",
    "########",
    "........",
  ],
  pilha: [
    "........",
    "########",
    "#......#",
    "########",
    "#......#",
    "########",
    "........",
    "........",
  ],
  emprestar: [
    '........',
    '...#....',
    '...##...',
    '#######.',
    '...##...',
    '...#....',
    '........',
    '........',
  ],
  devolver: [
    '........',
    '....#...',
    '...##...',
    '.#######',
    '...##...',
    '....#...',
    '........',
    '........',
  ],
  reserva: [
    '########',
    '.######.',
    '..####..',
    '...##...',
    '..####..',
    '.######.',
    '########',
    '........',
  ],
  busca: [
    '.####...',
    '#....#..',
    '#....#..',
    '#....#..',
    '.####...',
    '.....##.',
    '......##',
    '........',
  ],
  seta: [
    '..#.....',
    '..##....',
    '..###...',
    '..####..',
    '..###...',
    '..##....',
    '..#.....',
    '........',
  ],
  check: [
    '........',
    '......#.',
    '.....##.',
    '#...##..',
    '##.##...',
    '.####...',
    '..##....',
    '........',
  ],
  x: [
    '........',
    '.#....#.',
    '..#..#..',
    '...##...',
    '...##...',
    '..#..#..',
    '.#....#.',
    '........',
  ],
  alerta: [
    '...##...',
    '...##...',
    '...##...',
    '...##...',
    '...##...',
    '........',
    '...##...',
    '........',
  ],
  lampada: [
    '........',
    '..####..',
    '.######.',
    '.######.',
    '.######.',
    '.######.',
    '..####..',
    '........',
  ],
  sair: [
    '........',
    '.###....',
    '.#..#...',
    '.#..#.#.',
    '.#..###.',
    '.#..#.#.',
    '.###....',
    '........',
  ],
} as const;

export type IconName = keyof typeof MAPS;

export function PixelIcon({
  name,
  size = 16,
  color = 'currentColor',
  title,
}: {
  name: IconName;
  size?: number;
  color?: string;
  title?: string;
}) {
  const map = MAPS[name];
  const rects: React.ReactElement[] = [];

  map.forEach((row, y) => {
    let run = 0;
    for (let x = 0; x <= 8; x++) {
      const on = row[x] === '#';
      if (on) {
        run++;
      } else if (run > 0) {
        rects.push(<rect key={`${y}-${x}`} x={x - run} y={y} width={run} height={1} />);
        run = 0;
      }
    }
  });

  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      fill={color}
      shapeRendering="crispEdges"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: 'block', flex: 'none' }}
    >
      {title ? <title>{title}</title> : null}
      {rects}
    </svg>
  );
}
