import { ProvedorIa, normalizarBaseUrl } from '../../domain/entities/ConfiguracaoIa';
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

interface RespostaBusca {
  status: number;
  dados: unknown;
  pareceHtml: boolean;
}

/** GET com timeout. Lança somente em falha de rede/timeout. */
async function obterJson(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<RespostaBusca> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const resposta = await fetchImpl(url, { method: 'GET', headers, signal: controller.signal });
    const texto = await resposta.text();
    const contentType = resposta.headers.get('content-type');

    let dados: unknown = null;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = null;
    }

    const pareceHtml =
      (contentType ?? '').toLowerCase().includes('text/html') || texto.trimStart().startsWith('<');

    return { status: resposta.status, dados, pareceHtml };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    throw new ProvedorInvalidoError(`Não foi possível contatar ${url}: ${motivo}`);
  } finally {
    clearTimeout(timer);
  }
}

function erroUrlNaoEEApi(url: string, status: number): ProvedorInvalidoError {
  return new ProvedorInvalidoError(
    `O endereço ${url} não parece ser uma API de LLM (respondeu HTML, HTTP ${status}). ` +
      'Confira a URL base — deve ser algo como https://api.provedor.com/v1.',
  );
}

/**
 * Catálogo real: consulta `GET {baseUrl}/models` do provedor com a chave
 * informada. Serve também como validação da chave.
 */
export class CatalogoModelosHttp implements CatalogoModelos {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async listar(provedor: ProvedorIa, baseUrl: string, apiKey: string): Promise<ModeloIaDTO[]> {
    const base = normalizarBaseUrl(baseUrl);

    if (provedor === 'anthropic') {
      return this.listarAnthropic(base, apiKey);
    }
    if (provedor === 'openai') {
      return this.listarCompativelOpenAi(base, apiKey);
    }
    throw new ProvedorInvalidoError(`Adaptador "${provedor}" não suportado.`);
  }

  private async listarAnthropic(base: string, apiKey: string): Promise<ModeloIaDTO[]> {
    const { status, dados, pareceHtml } = await obterJson(
      `${base}/models?limit=100`,
      { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      this.fetchImpl,
    );

    if (pareceHtml) {
      throw erroUrlNaoEEApi(base, status);
    }
    if (status === 401 || status === 403) {
      throw new ProvedorInvalidoError(`A Anthropic recusou a chave de API (HTTP ${status}).`);
    }
    if (status < 200 || status >= 300) {
      throw new ProvedorInvalidoError(`A Anthropic respondeu HTTP ${status} ao listar modelos.`);
    }

    const modelos = (
      (dados as { data?: Array<{ id?: string; display_name?: string; supported_endpoints?: string[] }> })
        ?.data ?? []
    )
      .filter((modelo) => Boolean(modelo.id))
      .filter(
        (modelo) =>
          !Array.isArray(modelo.supported_endpoints) ||
          modelo.supported_endpoints.includes('/messages'),
      )
      .map((modelo) => ({
        id: modelo.id as string,
        nome: modelo.display_name ?? (modelo.id as string),
      }));

    return modelos.length > 0 ? modelos : MODELOS_FALLBACK.anthropic;
  }

  private async listarCompativelOpenAi(base: string, apiKey: string): Promise<ModeloIaDTO[]> {
    const ehOpenAiOficial = new URL(base).host === 'api.openai.com';
    const { status, dados, pareceHtml } = await obterJson(
      `${base}/models`,
      { authorization: `Bearer ${apiKey}` },
      this.fetchImpl,
    );

    if (pareceHtml) {
      throw erroUrlNaoEEApi(base, status);
    }
    if (status === 401 || status === 403) {
      throw new ProvedorInvalidoError(`O provedor recusou a chave de API (HTTP ${status}).`);
    }

    // Alguns serviços compatíveis não expõem /models. Nesse caso não bloqueamos a
    // integração: o usuário informa o nome do modelo manualmente.
    if (status === 404 || status === 405 || status === 501) {
      return ehOpenAiOficial ? MODELOS_FALLBACK.openai : [];
    }
    if (status < 200 || status >= 300) {
      throw new ProvedorInvalidoError(
        `O provedor respondeu HTTP ${status} ao listar modelos em ${base}/models.`,
      );
    }

    const itens =
      (dados as { data?: Array<{ id?: string; supported_endpoints?: string[] }> })?.data ?? [];

    // Alguns gateways informam quais endpoints cada modelo suporta (ex.: Command
    // Code expõe Claude só em /messages). Filtramos para não oferecer um modelo
    // que vai falhar no /chat/completions.
    const compativeis = itens.filter(
      (modelo) =>
        !Array.isArray(modelo.supported_endpoints) ||
        modelo.supported_endpoints.includes('/chat/completions'),
    );

    const ids = compativeis.map((modelo) => modelo.id ?? '').filter((id) => id.length > 0);

    // O catálogo da OpenAI oficial vem "poluído" (embeddings, tts, imagem...).
    // Nos demais provedores compatíveis não filtramos, pois os nomes variam.
    const selecionados = (ehOpenAiOficial ? ids.filter(ehModeloLlmOpenAi) : ids).sort();

    return selecionados.map((id) => ({ id, nome: id }));
  }
}
