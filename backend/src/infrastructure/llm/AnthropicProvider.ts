import { EntradaLlm, LlmProvider, ModoLlm } from '../../application/ports/LlmProvider';
import { LlmIndisponivelError } from '../../application/errors/AppError';
import { postJson } from './http';
import { SYSTEM_PROMPT_ASSISTENTE, montarMensagemUsuario, serializarContexto } from './prompts';

interface RespostaAnthropic {
  content?: Array<{ type: string; text?: string }>;
}

/**
 * Adapter real do Claude (Anthropic Messages API).
 * O prompt de sistema é enviado como bloco com `cache_control` para aproveitar
 * o prompt caching do provedor (o texto é estático entre chamadas).
 */
export class AnthropicProvider implements LlmProvider {
  readonly nome = 'anthropic';
  readonly modo: ModoLlm = 'real';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'claude-3-5-sonnet-latest',
  ) {}

  async responder({ pergunta, contexto }: EntradaLlm): Promise<string> {
    const dados = await postJson<RespostaAnthropic>(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      {
        model: this.model,
        max_tokens: 1024,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT_ASSISTENTE,
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
