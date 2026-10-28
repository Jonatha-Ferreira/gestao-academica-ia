/** Formata uma data ISO (YYYY-MM-DD) para o padrão brasileiro (DD/MM/YYYY). */
export function formatarData(dataISO: string | null | undefined): string {
  if (!dataISO) {
    return '—';
  }
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO);
  if (!partes) {
    return dataISO;
  }
  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

/** Formata uma competência ISO (YYYY-MM) para o padrão brasileiro (MM/YYYY). */
export function formatarCompetencia(competencia: string): string {
  const partes = /^(\d{4})-(\d{2})$/.exec(competencia);
  if (!partes) {
    return competencia;
  }
  return `${partes[2]}/${partes[1]}`;
}

/** Formata um valor em reais no padrão brasileiro (ex.: R$ 1.460,00). */
export function formatarMoeda(valorEmReais: number): string {
  return valorEmReais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata um valor em centavos no padrão brasileiro. */
export function formatarCentavos(centavos: number): string {
  return formatarMoeda(centavos / 100);
}
