import { describe, it, expect } from 'vitest';
import { escolherModeloPadrao } from '../../src/application/services/escolherModeloPadrao';
import { MODELO_PADRAO } from '../../src/domain/entities/ConfiguracaoIa';

const modelo = (id: string) => ({ id, nome: id });

describe('escolherModeloPadrao', () => {
  it('prefere a linha "flash" (haiku) e o alias -latest na Anthropic', () => {
    const escolhido = escolherModeloPadrao('anthropic', [
      modelo('claude-3-5-sonnet-latest'),
      modelo('claude-3-5-haiku-20241022'),
      modelo('claude-3-5-haiku-latest'),
    ]);

    expect(escolhido).toBe('claude-3-5-haiku-latest');
  });

  it('cai para a linha sonnet quando não há haiku', () => {
    const escolhido = escolherModeloPadrao('anthropic', [
      modelo('claude-3-5-sonnet-latest'),
      modelo('claude-opus-4-1'),
    ]);

    expect(escolhido).toBe('claude-3-5-sonnet-latest');
  });

  it('prefere a linha mini/nano na OpenAI', () => {
    const escolhido = escolherModeloPadrao('openai', [
      modelo('gpt-4o'),
      modelo('gpt-4.1-mini'),
      modelo('o3-mini'),
    ]);

    expect(escolhido).toBe('gpt-4.1-mini');
  });

  it('usa o alias constante quando a lista está vazia', () => {
    expect(escolherModeloPadrao('anthropic', [])).toBe(MODELO_PADRAO.anthropic);
    expect(escolherModeloPadrao('openai', [])).toBe(MODELO_PADRAO.openai);
  });

  it('usa o primeiro modelo da lista quando nenhum termo preferido aparece', () => {
    expect(escolherModeloPadrao('anthropic', [modelo('modelo-x'), modelo('modelo-y')])).toBe(
      'modelo-x',
    );
  });
});
