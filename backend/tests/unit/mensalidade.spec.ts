import { describe, it, expect } from 'vitest';
import { Mensalidade } from '../../src/domain/entities/Mensalidade';
import { DomainError } from '../../src/domain/errors/DomainError';

const REF = '2026-10-28';

function mensalidade(overrides: Partial<Parameters<typeof Mensalidade.criar>[0]> = {}) {
  return Mensalidade.criar({
    id: 'm1',
    competencia: '2026-09',
    vencimento: '2026-09-10',
    valorEmCentavos: 50000,
    pago: false,
    dataPagamento: null,
    ...overrides,
  });
}

describe('Mensalidade', () => {
  it('está em atraso quando não foi paga e o vencimento já passou', () => {
    expect(mensalidade({ pago: false, vencimento: '2026-09-10' }).estaEmAtraso(REF)).toBe(true);
  });

  it('NÃO está em atraso quando já foi paga, mesmo com vencimento passado', () => {
    const paga = mensalidade({ pago: true, vencimento: '2026-09-10', dataPagamento: '2026-09-05' });
    expect(paga.estaEmAtraso(REF)).toBe(false);
  });

  it('NÃO está em atraso quando o vencimento ainda não chegou', () => {
    expect(mensalidade({ pago: false, vencimento: '2026-11-10' }).estaEmAtraso(REF)).toBe(false);
  });

  it('trata o vencimento de hoje como ainda NÃO atrasado', () => {
    expect(mensalidade({ pago: false, vencimento: REF }).estaEmAtraso(REF)).toBe(false);
  });

  it('rejeita vencimento em formato inválido', () => {
    expect(() => mensalidade({ vencimento: '10/09/2026' })).toThrow(DomainError);
  });

  it('rejeita mensalidade paga sem data de pagamento', () => {
    expect(() => mensalidade({ pago: true, dataPagamento: null })).toThrow(DomainError);
  });

  it('rejeita valor não inteiro ou não positivo', () => {
    expect(() => mensalidade({ valorEmCentavos: 0 })).toThrow(DomainError);
    expect(() => mensalidade({ valorEmCentavos: 499.9 })).toThrow(DomainError);
  });
});
