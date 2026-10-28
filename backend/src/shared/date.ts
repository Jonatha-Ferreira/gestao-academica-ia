/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD) usando o fuso LOCAL.
 *
 * Importante: usamos a data local (e não `toISOString()`, que é UTC) para que
 * a regra de atraso não "vire o dia" indevidamente em fusos como o do Brasil
 * (UTC-3), onde uma parcela vencida hoje poderia ser avaliada como futura.
 */
export function dataISOHoje(agora: Date = new Date()): string {
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

/** Verifica se uma string está no formato de data ISO YYYY-MM-DD. */
export function ehDataISO(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}
