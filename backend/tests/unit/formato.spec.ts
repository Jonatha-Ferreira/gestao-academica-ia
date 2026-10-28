import { describe, it, expect } from 'vitest';
import { formatarCompetenciaBR, formatarDataBR } from '../../src/shared/date';
import { formatarMoedaBR } from '../../src/shared/money';

describe('formatação pt-BR', () => {
  it('converte data ISO para DD/MM/YYYY', () => {
    expect(formatarDataBR('2026-09-10')).toBe('10/09/2026');
  });

  it('devolve o valor original quando não está no formato ISO', () => {
    expect(formatarDataBR('10/09/2026')).toBe('10/09/2026');
  });

  it('converte competência ISO para MM/YYYY', () => {
    expect(formatarCompetenciaBR('2026-07')).toBe('07/2026');
  });

  it('formata valores em reais no padrão brasileiro', () => {
    expect(formatarMoedaBR(1460)).toContain('R$');
    expect(formatarMoedaBR(1460)).toContain('1.460,00');
    expect(formatarMoedaBR(0)).toContain('0,00');
  });
});
