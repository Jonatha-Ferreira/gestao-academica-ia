import { LlmIndisponivelError } from '../../application/errors/AppError';

/**
 * POST JSON com timeout e normalização de erros para `LlmIndisponivelError`.
 * Usamos o `fetch` nativo do Node 20 — sem SDK, mantendo o adapter transparente
 * e sem dependências pesadas.
 */
export async function postJson<T>(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs = 20000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const texto = await resposta.text();

    if (!resposta.ok) {
      throw new LlmIndisponivelError(
        `Provedor de IA respondeu ${resposta.status}: ${texto.slice(0, 200)}`,
      );
    }

    return JSON.parse(texto) as T;
  } catch (erro) {
    if (erro instanceof LlmIndisponivelError) {
      throw erro;
    }
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new LlmIndisponivelError(`Falha ao contatar o provedor de IA: ${motivo}`);
  } finally {
    clearTimeout(timer);
  }
}
