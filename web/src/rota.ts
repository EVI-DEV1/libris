/**
 * Duas portas de entrada, cada uma com endereço próprio.
 *
 * Sem biblioteca de rotas: o app tem duas telas de entrada e nada mais que
 * dependa de URL. Um router inteiro para isso seria peso sem troco.
 */
export type Porta = 'funcionarios' | 'direcao';

export const CAMINHO: Record<Porta, string> = {
  funcionarios: '/',
  direcao: '/direcao',
};

export function portaAtual(): Porta {
  return window.location.pathname.replace(/\/+$/, '') === '/direcao' ? 'direcao' : 'funcionarios';
}

/** Troca de porta sem recarregar a página. */
export function irPara(porta: Porta) {
  window.history.pushState({}, '', CAMINHO[porta]);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
