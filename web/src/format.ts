/** Formatação da casa: data curta, dinheiro em real, plural sem gambiarra. */

export const dia = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const reais = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);

/** Dias inteiros até a data — negativo quando já passou. */
export function diasAte(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}
