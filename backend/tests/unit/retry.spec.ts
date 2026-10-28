import { describe, it, expect } from 'vitest';
import { comRetry } from '../../src/application/services/comRetry';
import { LlmIndisponivelError, RespostaInvalidaError } from '../../src/application/errors/AppError';
import { DomainError } from '../../src/domain/errors/DomainError';

const SEM_ESPERA = { tentativas: 3, baseMs: 0 };

describe('comRetry', () => {
  it('repete e tem sucesso na segunda tentativa', async () => {
    let tentativas = 0;

    const resultado = await comRetry(async () => {
      tentativas += 1;
      if (tentativas < 2) {
        throw new RespostaInvalidaError();
      }
      return 'ok';
    }, SEM_ESPERA);

    expect(resultado).toBe('ok');
    expect(tentativas).toBe(2);
  });

  it('repete falha transitória do provedor', async () => {
    let tentativas = 0;

    const resultado = await comRetry(async () => {
      tentativas += 1;
      if (tentativas === 1) {
        throw new LlmIndisponivelError('provedor fora');
      }
      return 'ok';
    }, SEM_ESPERA);

    expect(resultado).toBe('ok');
    expect(tentativas).toBe(2);
  });

  it('desiste após o número máximo e relança o último erro', async () => {
    let tentativas = 0;

    await expect(
      comRetry(async () => {
        tentativas += 1;
        throw new RespostaInvalidaError('sempre inválido');
      }, SEM_ESPERA),
    ).rejects.toBeInstanceOf(RespostaInvalidaError);

    expect(tentativas).toBe(3);
  });

  it('NÃO repete erros não recuperáveis', async () => {
    let tentativas = 0;

    await expect(
      comRetry(async () => {
        tentativas += 1;
        throw new DomainError('erro de negócio');
      }, SEM_ESPERA),
    ).rejects.toBeInstanceOf(DomainError);

    expect(tentativas).toBe(1);
  });

  it('informa o número da tentativa para a operação', async () => {
    const vistas: number[] = [];

    await comRetry(async (tentativa) => {
      vistas.push(tentativa);
      if (tentativa < 3) {
        throw new RespostaInvalidaError();
      }
      return tentativa;
    }, SEM_ESPERA);

    expect(vistas).toEqual([1, 2, 3]);
  });
});
