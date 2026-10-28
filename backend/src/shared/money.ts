/**
 * Valores monetários circulam como inteiros em centavos para evitar erros de
 * ponto flutuante. A conversão para reais só acontece na borda (apresentação/IA).
 */
export function centavosParaReais(centavos: number): number {
  return Number((centavos / 100).toFixed(2));
}
