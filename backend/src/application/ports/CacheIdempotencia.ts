/**
 * Cache de idempotência com semântica de "executa uma vez por chave".
 *
 * Usado para que um retry do cliente (mesma `Idempotency-Key` na mesma sessão)
 * não gere uma segunda chamada ao modelo nem duplique a mensagem: chamadas
 * concorrentes e repetidas recebem o mesmo resultado.
 */
export interface CacheIdempotencia {
  executar<T>(chave: string, operacao: () => Promise<T>): Promise<T>;
}
