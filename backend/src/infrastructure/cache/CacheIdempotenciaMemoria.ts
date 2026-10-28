import { CacheIdempotencia } from '../../application/ports/CacheIdempotencia';

interface Entrada {
  promessa: Promise<unknown>;
  expiraEm: number;
}

/**
 * Cache de idempotência em memória, com TTL e limite de tamanho.
 *
 * Semântica de "single-flight": a primeira chamada executa; chamadas
 * concorrentes (duplo clique) ou repetidas com a mesma chave (retry) recebem a
 * MESMA promessa — sem segunda chamada ao modelo e sem duplicar a mensagem.
 * Falhas não são cacheadas, para que um retry possa tentar de novo.
 */
export class CacheIdempotenciaMemoria implements CacheIdempotencia {
  private readonly entradas = new Map<string, Entrada>();

  constructor(
    private readonly ttlMs = 5 * 60_000,
    private readonly maximo = 500,
  ) {}

  async executar<T>(chave: string, operacao: () => Promise<T>): Promise<T> {
    this.limparExpirados();

    const existente = this.entradas.get(chave);
    if (existente) {
      return existente.promessa as Promise<T>;
    }

    const promessa = operacao();
    this.entradas.set(chave, { promessa, expiraEm: Date.now() + this.ttlMs });
    this.limitarTamanho();

    try {
      return await promessa;
    } catch (erro) {
      this.entradas.delete(chave);
      throw erro;
    }
  }

  private limparExpirados(): void {
    const agora = Date.now();
    for (const [chave, entrada] of this.entradas) {
      if (entrada.expiraEm <= agora) {
        this.entradas.delete(chave);
      }
    }
  }

  private limitarTamanho(): void {
    while (this.entradas.size > this.maximo) {
      const maisAntiga = this.entradas.keys().next().value;
      if (maisAntiga === undefined) {
        break;
      }
      this.entradas.delete(maisAntiga);
    }
  }
}
