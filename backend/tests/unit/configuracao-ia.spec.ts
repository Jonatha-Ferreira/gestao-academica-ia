import { describe, it, expect } from 'vitest';
import {
  BASE_URL_PADRAO,
  ConfiguracaoIa,
  MODELO_PADRAO,
  PROMPT_SISTEMA_PADRAO,
} from '../../src/domain/entities/ConfiguracaoIa';
import { DomainError } from '../../src/domain/errors/DomainError';

function base(overrides: Partial<Parameters<typeof ConfiguracaoIa.criar>[0]> = {}) {
  return {
    provedor: 'anthropic' as const,
    apiKey: 'chave-de-teste-anthropic',
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

  it('usa o modelo padrão do provedor quando o modelo não é informado', () => {
    const anthropic = ConfiguracaoIa.criar({ provedor: 'anthropic', apiKey: 'chave-de-teste-anthropic' });
    expect(anthropic.modelo).toBe(MODELO_PADRAO.anthropic);

    const openai = ConfiguracaoIa.criar({ provedor: 'openai', apiKey: 'chave-de-teste-openai', modelo: '   ' });
    expect(openai.modelo).toBe(MODELO_PADRAO.openai);
  });

  it('usa a URL base padrão e o rótulo do adaptador quando não informados', () => {
    const config = ConfiguracaoIa.criar({ provedor: 'anthropic', apiKey: 'chave' });
    expect(config.baseUrl).toBe(BASE_URL_PADRAO.anthropic);
    expect(config.rotulo).toBe('Anthropic');
  });

  it('aceita URL base e rótulo personalizados (provedor genérico compatível)', () => {
    const config = ConfiguracaoIa.criar({
      provedor: 'openai',
      rotulo: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1/',
      apiKey: 'chave',
    });

    expect(config.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(config.rotulo).toBe('DeepSeek');
  });

  it('rejeita URL base inválida', () => {
    expect(() =>
      ConfiguracaoIa.criar({ provedor: 'openai', baseUrl: 'nao-e-url', apiKey: 'chave' }),
    ).toThrow(DomainError);
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
    expect(JSON.stringify(config.toPublico())).not.toContain('chave-de-teste-anthropic');
  });
});
