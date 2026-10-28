import { LlmIndisponivelError } from '../../application/errors/AppError';

/** Detecta resposta HTML — sinal de que a URL não é um endpoint de API. */
function pareceHtml(texto: string, contentType: string | null): boolean {
  return (
    (contentType ?? '').toLowerCase().includes('text/html') || texto.trimStart().startsWith('<')
  );
}

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
    const contentType = resposta.headers.get('content-type');

    if (!resposta.ok) {
      // HTML quase sempre significa "URL errada" (site em vez de API).
      if (pareceHtml(texto, contentType)) {
        throw new LlmIndisponivelError(
          `O endereço ${url} não parece ser uma API de LLM (respondeu HTML, HTTP ${resposta.status}). ` +
            'Confira a URL base — deve ser algo como https://api.provedor.com/v1.',
        );
      }
      throw new LlmIndisponivelError(
        `O provedor respondeu HTTP ${resposta.status}: ${texto.slice(0, 200)}`,
      );
    }

    try {
      return JSON.parse(texto) as T;
    } catch {
      throw new LlmIndisponivelError(
        `O endereço ${url} respondeu algo que não é JSON. Confira se a URL base é de uma API de LLM.`,
      );
    }
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
