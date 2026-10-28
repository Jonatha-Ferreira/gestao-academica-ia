/**
 * Valores monetários circulam como inteiros em centavos para evitar erros de
 * ponto flutuante. A conversão para reais só acontece na borda (apresentação/IA).
 */
export function centavosParaReais(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}

const FORMATADOR_MOEDA = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Formata um valor em reais no padrão brasileiro (ex.: R$ 1.460,00). */
export function formatarMoedaBR(valorEmReais: number): string {
  return FORMATADOR_MOEDA.format(valorEmReais);
}
