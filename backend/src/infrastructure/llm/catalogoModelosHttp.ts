import { ProvedorIa } from '../../domain/entities/ConfiguracaoIa';
import { CatalogoModelos } from '../../application/ports/CatalogoModelos';
import { ModeloIaDTO } from '../../application/dtos/ia.dto';
import { ProvedorInvalidoError } from '../../application/errors/AppError';

/** Modelos usados como sugestão caso o provedor não devolva a lista. */
export const MODELOS_FALLBACK: Record<ProvedorIa, ModeloIaDTO[]> = {
  anthropic: [
    { id: 'claude-3-7-sonnet-latest', nome: 'Claude 3.7 Sonnet (latest)' },
    { id: 'claude-3-5-sonnet-latest', nome: 'Claude 3.5 Sonnet (latest)' },
    { id: 'claude-3-5-haiku-latest', nome: 'Claude 3.5 Haiku (latest)' },
  ],
  openai: [
    { id: 'gpt-4o-mini', nome: 'gpt-4o-mini' },
    { id: 'gpt-4o', nome: 'gpt-4o' },
    { id: 'o3-mini', nome: 'o3-mini' },
  ],
};

const PREFIXOS_LLM_OPENAI = ['gpt-', 'o1', 'o3', 'o4', 'chatgpt'];
const EXCLUIDOS_OPENAI = [
  'audio',
  'realtime',
  'transcribe',
  'tts',
  'image',
  'embedding',
  'moderation',
  'dall-e',
  'whisper',
  'search',
  'instruct',
  'davinci',
  'babbage',
  'sora',
];

/** Mantém apenas modelos de chat/LLM da OpenAI (descarta áudio, imagem, embeddings...). */
export function ehModeloLlmOpenAi(id: string): boolean {
  const alvo = id.toLowerCase();
  if (EXCLUIDOS_OPENAI.some((termo) => alvo.includes(termo))) {
    return false;
  }
  return PREFIXOS_LLM_OPENAI.some((prefixo) => alvo.startsWith(prefixo));
}

async function buscarJson(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const resposta = await fetchImpl(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    const texto = await resposta.text();
    if (!resposta.ok) {
      throw new ProvedorInvalidoError(
        `O provedor recusou a requisição (HTTP ${resposta.status}). Verifique a chave de API.`,
      );
    }
    return JSON.parse(texto);
  } catch (erro) {
    if (erro instanceof ProvedorInvalidoError) {
      throw erro;
    }
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new ProvedorInvalidoError(`Não foi possível validar a chave junto ao provedor: ${motivo}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Catálogo real: consulta `GET /v1/models` do provedor com a chave informada.
 * Uma chave inválida provoca erro (a integração é recusada).
 */
export class CatalogoModelosHttp implements CatalogoModelos {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async listar(provedor: ProvedorIa, apiKey: string): Promise<ModeloIaDTO[]> {
    if (provedor === 'anthropic') {
      return this.listarAnthropic(apiKey);
    }
    if (provedor === 'openai') {
      return this.listarOpenAi(apiKey);
    }
    throw new ProvedorInvalidoError(`Provedor "${provedor}" não suportado. Apenas LLMs.`);
  }

  private async listarAnthropic(apiKey: string): Promise<ModeloIaDTO[]> {
    const dados = (await buscarJson(
      'https://api.anthropic.com/v1/models?limit=100',
      { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      this.fetchImpl,
    )) as { data?: Array<{ id?: string; display_name?: string }> };

    const modelos = (dados.data ?? [])
      .filter((modelo) => Boolean(modelo.id))
      .map((modelo) => ({ id: modelo.id as string, nome: modelo.display_name ?? (modelo.id as string) }));

    return modelos.length > 0 ? modelos : MODELOS_FALLBACK.anthropic;
  }

  private async listarOpenAi(apiKey: string): Promise<ModeloIaDTO[]> {
    const dados = (await buscarJson(
      'https://api.openai.com/v1/models',
      { authorization: `Bearer ${apiKey}` },
      this.fetchImpl,
    )) as { data?: Array<{ id?: string }> };

    const modelos = (dados.data ?? [])
      .map((modelo) => modelo.id ?? '')
      .filter((id) => ehModeloLlmOpenAi(id))
      .sort()
      .map((id) => ({ id, nome: id }));

    return modelos.length > 0 ? modelos : MODELOS_FALLBACK.openai;
  }
}
