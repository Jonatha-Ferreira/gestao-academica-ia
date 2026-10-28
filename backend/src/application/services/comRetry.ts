import { LlmIndisponivelError, RespostaInvalidaError } from '../errors/AppError';

export interface OpcoesRetry {
  /** Número total de tentativas (inclui a primeira). */
  tentativas: number;
  /** Base do backoff exponencial em ms (0 desativa a espera, útil em testes). */
  baseMs: number;
}

/** Só vale a pena repetir falhas transitórias ou de formato. */
export function erroRecuperavel(erro: unknown): boolean {
  return erro instanceof LlmIndisponivelError || erro instanceof RespostaInvalidaError;
}

const dormir = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Executa a operação com backoff exponencial e jitter. Reenvia apenas erros
 * recuperáveis (provedor indisponível / resposta fora do contrato).
 */
export async function comRetry<T>(
  operacao: (tentativa: number) => Promise<T>,
  opcoes: OpcoesRetry,
): Promise<T> {
  const tentativas = Math.max(1, opcoes.tentativas);
  let ultimoErro: unknown;

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    try {
      return await operacao(tentativa);
    } catch (erro) {
      ultimoErro = erro;
      const ultimaTentativa = tentativa === tentativas;
      if (!erroRecuperavel(erro) || ultimaTentativa) {
        break;
      }
      if (opcoes.baseMs > 0) {
        // Exponencial com jitter (50%..100%) para não sincronizar retries.
        const espera = opcoes.baseMs * 2 ** (tentativa - 1) * (0.5 + Math.random() * 0.5);
        await dormir(espera);
      }
    }
  }

  throw ultimoErro;
}
