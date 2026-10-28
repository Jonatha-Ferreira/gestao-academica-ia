import { EntradaLlm, LlmProvider, ModoLlm } from '../../application/ports/LlmProvider';
import { LlmIndisponivelError } from '../../application/errors/AppError';
import {
  BASE_URL_PADRAO,
  MODELO_PADRAO,
  PROMPT_SISTEMA_PADRAO,
} from '../../domain/entities/ConfiguracaoIa';
import { postJson } from './http';
import { montarMensagemUsuario, serializarContexto } from './prompts';
import { OpcoesProvedorIa } from './AnthropicProvider';

interface RespostaOpenAi {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Adapter de qualquer provedor compatível com a API da OpenAI
 * (`POST {baseUrl}/chat/completions`): OpenAI, DeepSeek, Groq, OpenRouter,
 * Cohere (Command), Mistral, Together, Ollama, LM Studio, vLLM...
 * É a URL base que define o provedor.
 */
export class OpenAiProvider implements LlmProvider {
  readonly nome = 'openai';
  readonly modo: ModoLlm = 'real';

  private readonly baseUrl: string;
  private readonly modelo: string;
  private readonly promptSistema: string;
  private readonly temperatura: number;
  private readonly maxTokens: number;

  constructor(private readonly opcoes: OpcoesProvedorIa) {
    this.baseUrl = (opcoes.baseUrl?.trim() || BASE_URL_PADRAO.openai).replace(/\/+$/, '');
    this.modelo = opcoes.modelo?.trim() || MODELO_PADRAO.openai;
    this.promptSistema = opcoes.promptSistema?.trim() || PROMPT_SISTEMA_PADRAO;
    this.temperatura = opcoes.temperatura ?? 0.2;
    this.maxTokens = opcoes.maxTokens ?? 1024;
  }

  async responder({ pergunta, contexto }: EntradaLlm): Promise<string> {
    const dados = await postJson<RespostaOpenAi>(
      `${this.baseUrl}/chat/completions`,
      { authorization: `Bearer ${this.opcoes.apiKey}` },
      {
        model: this.modelo,
        temperature: this.temperatura,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: this.promptSistema },
          { role: 'user', content: montarMensagemUsuario(pergunta, serializarContexto(contexto)) },
        ],
      },
    );

    const texto = dados.choices?.[0]?.message?.content?.trim();
    if (!texto) {
      throw new LlmIndisponivelError('O provedor retornou uma resposta vazia.');
    }
    return texto;
  }
}
