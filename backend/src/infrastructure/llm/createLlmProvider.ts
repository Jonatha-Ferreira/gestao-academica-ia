import { LlmProvider } from '../../application/ports/LlmProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { OpenAiProvider } from './OpenAiProvider';
import { DemoProvider } from './DemoProvider';

/**
 * Seleção do provedor de IA a partir das variáveis de ambiente.
 *
 *   LLM_PROVIDER=anthropic -> exige ANTHROPIC_API_KEY
 *   LLM_PROVIDER=openai    -> exige OPENAI_API_KEY
 *   LLM_PROVIDER=demo      -> respostas locais (sem rede)
 *   LLM_PROVIDER=auto/ausente -> anthropic, senão openai, senão demo
 */
export function createLlmProvider(env: NodeJS.ProcessEnv = process.env): LlmProvider {
  const desejado = (env.LLM_PROVIDER ?? 'auto').toLowerCase().trim();
  const anthropicKey = env.ANTHROPIC_API_KEY?.trim();
  const openAiKey = env.OPENAI_API_KEY?.trim();

  if (desejado === 'anthropic') {
    if (!anthropicKey) {
      throw new Error('LLM_PROVIDER=anthropic requer ANTHROPIC_API_KEY definida.');
    }
    return new AnthropicProvider(anthropicKey, env.ANTHROPIC_MODEL || undefined);
  }

  if (desejado === 'openai') {
    if (!openAiKey) {
      throw new Error('LLM_PROVIDER=openai requer OPENAI_API_KEY definida.');
    }
    return new OpenAiProvider(openAiKey, env.OPENAI_MODEL || undefined);
  }

  if (desejado === 'demo') {
    return new DemoProvider();
  }

  if (anthropicKey) {
    return new AnthropicProvider(anthropicKey, env.ANTHROPIC_MODEL || undefined);
  }
  if (openAiKey) {
    return new OpenAiProvider(openAiKey, env.OPENAI_MODEL || undefined);
  }
  return new DemoProvider();
}
