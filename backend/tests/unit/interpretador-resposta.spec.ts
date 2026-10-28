import { describe, it, expect } from 'vitest';
import { InterpretadorRespostaJson } from '../../src/infrastructure/llm/interpretadorRespostaJson';
import { RespostaInvalidaError } from '../../src/application/errors/AppError';

const interpretador = new InterpretadorRespostaJson();

describe('InterpretadorRespostaJson', () => {
  it('interpreta um JSON válido no contrato', () => {
    const resultado = interpretador.interpretar(
      '{"resposta":"ok","adimplentes":[{"nome":"Maria","matricula":"202602"}],"inadimplentes":[]}',
    );

    expect(resultado.resposta).toBe('ok');
    expect(resultado.adimplentes[0]).toEqual({ nome: 'Maria', matricula: '202602' });
    expect(resultado.inadimplentes).toEqual([]);
  });

  it('aceita JSON cercado por bloco markdown', () => {
    const resultado = interpretador.interpretar(
      '```json\n{"resposta":"ok","adimplentes":[],"inadimplentes":[]}\n```',
    );
    expect(resultado.resposta).toBe('ok');
  });

  it('recorta texto ao redor do JSON', () => {
    const resultado = interpretador.interpretar(
      'Segue o resultado: {"resposta":"ok","adimplentes":[],"inadimplentes":[]} espero ter ajudado',
    );
    expect(resultado.resposta).toBe('ok');
  });

  it('aplica lista vazia quando os arrays são omitidos', () => {
    const resultado = interpretador.interpretar('{"resposta":"ok"}');
    expect(resultado.adimplentes).toEqual([]);
    expect(resultado.inadimplentes).toEqual([]);
  });

  it('preserva valorEmAtraso dos inadimplentes', () => {
    const resultado = interpretador.interpretar(
      '{"resposta":"ok","adimplentes":[],"inadimplentes":[{"nome":"Ana","matricula":"202604","valorEmAtraso":960}]}',
    );
    expect(resultado.inadimplentes[0]?.valorEmAtraso).toBe(960);
  });

  it('lança RespostaInvalidaError quando o texto não é JSON', () => {
    expect(() => interpretador.interpretar('Nenhum aluno está inadimplente.')).toThrow(
      RespostaInvalidaError,
    );
  });

  it('lança RespostaInvalidaError quando falta o campo resposta', () => {
    expect(() => interpretador.interpretar('{"adimplentes":[]}')).toThrow(RespostaInvalidaError);
  });

  it('lança RespostaInvalidaError quando a lista tem item inválido', () => {
    expect(() =>
      interpretador.interpretar('{"resposta":"ok","adimplentes":[{"nome":""}]}'),
    ).toThrow(RespostaInvalidaError);
  });
});
