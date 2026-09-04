/**
 * O NOME DO PRODUTO MORA AQUI, E SÓ AQUI.
 *
 * "Libris" vem de *ex libris* — a marca que a biblioteca carimba no livro para
 * dizer de quem ele é. É o que este sistema faz: guarda de quem é cada
 * exemplar, e onde ele está agora.
 *
 * Trocar leva um minuto: mude as linhas abaixo e nada mais no código precisa
 * ser tocado. Nenhum outro arquivo escreve o nome literalmente — nem a chave
 * de sessão no navegador, que é propositalmente neutra para não virar resíduo
 * do nome antigo na próxima troca.
 */
export const brand = {
  /** Nome curto, usado no cabeçalho e no título da aba. */
  name: 'Libris',
  /** O que o produto é, em uma linha. */
  tagline: 'Gestão de biblioteca',
  /** Nome de quem opera, no vocabulário da casa. */
  surface: 'atendimento',
} as const;
