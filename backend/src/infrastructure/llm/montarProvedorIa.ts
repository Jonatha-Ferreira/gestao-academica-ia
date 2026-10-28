import { ConfiguracaoIa } from '../../domain/entities/ConfiguracaoIa';
import { LlmProvider } from '../../application/ports/LlmProvider';
import { AnthropicProvider, OpcoesProvedorIa } from './AnthropicProvider';
import { OpenAiProvider } from './OpenAiProvider';

/** Monta o `LlmProvider` real correspondente à configuração salva. */
export function montarProvedorIa(configuracao: ConfiguracaoIa): LlmProvider {
  const opcoes: OpcoesProvedorIa = {
    apiKey: configuracao.apiKey,
    baseUrl: configuracao.baseUrl,
    modelo: configuracao.modelo,
    promptSistema: configuracao.promptSistema,
    temperatura: configuracao.temperatura,
    maxTokens: configuracao.maxTokens,
  };

  return configuracao.provedor === 'anthropic'
    ? new AnthropicProvider(opcoes)
    : new OpenAiProvider(opcoes);
}
