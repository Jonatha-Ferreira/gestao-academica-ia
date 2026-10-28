import { describe, it, expect } from 'vitest';
import { ConfiguracaoIa, PROMPT_SISTEMA_PADRAO } from '../../src/domain/entities/ConfiguracaoIa';
import { DomainError } from '../../src/domain/errors/DomainError';

function base(overrides: Partial<Parameters<typeof ConfiguracaoIa.criar>[0]> = {}) {
  return {
    provedor: 'anthropic' as const,
    apiKey: 'sk-ant-123',
    modelo: 'claude-3-5-sonnet-latest',
    ...overrides,
  };
}

describe('ConfiguracaoIa', () => {
  it('aceita apenas provedores de LLM conhecidos', () => {
    expect(() => ConfiguracaoIa.criar(base({ provedor: 'gemini' as never }))).toThrow(DomainError);
  });

  it('exige uma chave de API', () => {
    expect(() => ConfiguracaoIa.criar(base({ apiKey: '   ' }))).toThrow(DomainError);
  });

  it('exige um modelo', () => {
    expect(() => ConfiguracaoIa.criar(base({ modelo: '' }))).toThrow(DomainError);
  });

  it('rejeita temperatura fora do intervalo 0..2', () => {
    expect(() => ConfiguracaoIa.criar(base({ temperatura: 3 }))).toThrow(DomainError);
    expect(() => ConfiguracaoIa.criar(base({ temperatura: -1 }))).toThrow(DomainError);
  });

  it('usa o template padrão quando as regras não são informadas', () => {
    const config = ConfiguracaoIa.criar(base());
    expect(config.promptSistema).toBe(PROMPT_SISTEMA_PADRAO);
  });

  it('não expõe a chave de API na versão pública', () => {
    const config = ConfiguracaoIa.criar(base());
    expect(config.toPublico()).not.toHaveProperty('apiKey');
    expect(JSON.stringify(config.toPublico())).not.toContain('sk-ant-123');
  });
});
