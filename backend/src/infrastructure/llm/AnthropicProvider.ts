import { EntradaLlm, LlmProvider, ModoLlm } from '../../application/ports/LlmProvider';
import { LlmIndisponivelError } from '../../application/errors/AppError';
import { PROMPT_SISTEMA_PADRAO } from '../../domain/entities/ConfiguracaoIa';
import { postJson } from './http';
import { montarMensagemUsuario, serializarContexto } from './prompts';

export interface OpcoesProvedorIa {
  apiKey: string;
  modelo?: string;
  promptSistema?: string;
  temperatura?: number;
  maxTokens?: number;
}

interface RespostaAnthropic {
  content?: Array<{ type: string; text?: string }>;
}

/**
 * Adapter real do Claude (Anthropic Messages API).
 * O prompt de sistema é enviado como bloco com `cache_control` para aproveitar
 * o prompt caching do provedor.
 */
export class AnthropicProvider implements LlmProvider {
  readonly nome = 'anthropic';
  readonly modo: ModoLlm = 'real';

  private readonly modelo: string;
  private readonly promptSistema: string;
  private readonly temperatura: number;
  private readonly maxTokens: number;

  constructor(private readonly opcoes: OpcoesProvedorIa) {
    this.modelo = opcoes.modelo?.trim() || 'claude-3-5-sonnet-latest';
    this.promptSistema = opcoes.promptSistema?.trim() || PROMPT_SISTEMA_PADRAO;
    // A Anthropic aceita temperatura entre 0 e 1.
    this.temperatura = Math.min(Math.max(opcoes.temperatura ?? 0.2, 0), 1);
    this.maxTokens = opcoes.maxTokens ?? 1024;
  }

  async responder({ pergunta, contexto }: EntradaLlm): Promise<string> {
    const dados = await postJson<RespostaAnthropic>(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': this.opcoes.apiKey,
        'anthropic-version': '2023-06-01',
      },
      {
        model: this.modelo,
        max_tokens: this.maxTokens,
        temperature: this.temperatura,
        system: [
          {
            type: 'text',
            text: this.promptSistema,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: montarMensagemUsuario(pergunta, serializarContexto(contexto)),
          },
        ],
      },
    );

    const texto = (dados.content ?? [])
      .map((bloco) => bloco.text ?? '')
      .join('')
      .trim();

    if (!texto) {
      throw new LlmIndisponivelError('A Anthropic retornou uma resposta vazia.');
    }
    return texto;
  }
}
