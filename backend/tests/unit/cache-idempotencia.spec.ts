import { describe, it, expect } from 'vitest';
import { CacheIdempotenciaMemoria } from '../../src/infrastructure/cache/CacheIdempotenciaMemoria';

describe('CacheIdempotenciaMemoria', () => {
  it('executa uma única vez para a mesma chave', async () => {
    const cache = new CacheIdempotenciaMemoria();
    let execucoes = 0;
    const operacao = async () => {
      execucoes += 1;
      return 'resultado';
    };

    const primeiro = await cache.executar('s1:k1', operacao);
    const segundo = await cache.executar('s1:k1', operacao);

    expect(primeiro).toBe('resultado');
    expect(segundo).toBe('resultado');
    expect(execucoes).toBe(1);
  });

  it('deduplica chamadas concorrentes (single-flight)', async () => {
    const cache = new CacheIdempotenciaMemoria();
    let execucoes = 0;
    const operacao = async () => {
      execucoes += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return execucoes;
    };

    const [a, b] = await Promise.all([
      cache.executar('sessao:chave', operacao),
      cache.executar('sessao:chave', operacao),
    ]);

    expect(execucoes).toBe(1);
    expect(a).toBe(b);
  });

  it('chaves diferentes executam separadamente', async () => {
    const cache = new CacheIdempotenciaMemoria();
    let execucoes = 0;
    const operacao = async () => {
      execucoes += 1;
      return execucoes;
    };

    await cache.executar('s1:k1', operacao);
    await cache.executar('s1:k2', operacao);

    expect(execucoes).toBe(2);
  });

  it('não cacheia falha, permitindo retry', async () => {
    const cache = new CacheIdempotenciaMemoria();
    let execucoes = 0;

    const falha = async () => {
      execucoes += 1;
      throw new Error('falhou');
    };

    await expect(cache.executar('s:k', falha)).rejects.toThrow('falhou');

    const sucesso = async () => {
      execucoes += 1;
      return 'ok';
    };

    await expect(cache.executar('s:k', sucesso)).resolves.toBe('ok');
    expect(execucoes).toBe(2);
  });

  it('expira a entrada conforme o TTL', async () => {
    const cache = new CacheIdempotenciaMemoria(0);
    let execucoes = 0;
    const operacao = async () => {
      execucoes += 1;
      return execucoes;
    };

    await cache.executar('s:k', operacao);
    await cache.executar('s:k', operacao);

    expect(execucoes).toBe(2);
  });
});
