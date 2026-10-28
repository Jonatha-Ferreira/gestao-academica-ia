import { LlmProvider } from '../../application/ports/LlmProvider';
import { BASE_URL_PADRAO, PROMPT_SISTEMA_PADRAO } from '../../domain/entities/ConfiguracaoIa';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAiProvider } from './OpenAiProvider';
import { DemoProvider } from './DemoProvider';

/**
 * Provedor padrão (fallback) definido por variáveis de ambiente, usado enquanto
 * nenhuma integração real for configurada pela aplicação.
 *
 *   LLM_PROVIDER=anthropic -> exige ANTHROPIC_API_KEY
 *   LLM_PROVIDER=openai    -> exige OPENAI_API_KEY
 *   LLM_PROVIDER=demo      -> respostas locais (sem rede)
 *   LLM_PROVIDER=auto/ausente -> anthropic, senão openai, senão demo
 *
 * As URLs base podem ser sobrescritas por ANTHROPIC_BASE_URL / OPENAI_BASE_URL
 * (útil para gateways/proxies ou provedores compatíveis).
 */
export function createLlmProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider {
  const desejado = (env.LLM_PROVIDER ?? 'auto').toLowerCase().trim();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const openAiKey = env.OPENAI_API_KEY?.trim();

  if (desejado === 'anthropic') {
    if (!anthropicKey) {
      throw new Error('LLM_PROVIDER=anthropic requer ANTHROPIC_API_KEY definida.');
    }
    return new AnthropicProvider({
      apiKey: anthropicKey,
      baseUrl: env.ANTHROPIC_BASE_URL || BASE_URL_PADRAO.anthropic,
      modelo: env.ANTHROPIC_MODEL,
      promptSistema: PROMPT_SISTEMA_PADRAO,
    });
  }

  if (desejado === 'openai') {
    if (!openAiKey) {
      throw new Error('LLM_PROVIDER=openai requer OPENAI_API_KEY definida.');
    }
    return new OpenAiProvider({
      apiKey: openAiKey,
      baseUrl: env.OPENAI_BASE_URL || BASE_URL_PADRAO.openai,
      modelo: env.OPENAI_MODEL,
      promptSistema: PROMPT_SISTEMA_PADRAO,
    });
  }

  if (desejado === 'demo') {
    return new DemoProvider();
  }

  if (anthropicKey) {
    return new AnthropicProvider({
      apiKey: anthropicKey,
      baseUrl: env.ANTHROPIC_BASE_URL || BASE_URL_PADRAO.anthropic,
      modelo: env.ANTHROPIC_MODEL,
      promptSistema: PROMPT_SISTEMA_PADRAO,
    });
  }
  if (openAiKey) {
    return new OpenAiProvider({
      apiKey: openAiKey,
      baseUrl: env.OPENAI_BASE_URL || BASE_URL_PADRAO.openai,
      modelo: env.OPENAI_MODEL,
      promptSistema: PROMPT_SISTEMA_PADRAO,
    });
  }
  return new DemoProvider();
}
