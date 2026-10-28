import { EntradaLlm, LlmProvider, ModoLlm } from '../../application/ports/LlmProvider';
import { LlmIndisponivelError } from '../../application/errors/AppError';
import { postJson } from './http';
import { SYSTEM_PROMPT_ASSISTENTE, montarMensagemUsuario, serializarContexto } from './prompts';

interface RespostaOpenAi {
  choices?: Array<{ message?: { content?: string } }>;
}

/** Adapter real da OpenAI (Chat Completions). */
export class OpenAiProvider implements LlmProvider {
  readonly nome = 'openai';
  readonly modo: ModoLlm = 'real';

  constructor(
    private readonly apiKey: string,
    private readonly model = 'gpt-4o-mini',
  ) {}

  async responder({ pergunta, contexto }: EntradaLlm): Promise<string> {
    const dados = await postJson<RespostaOpenAi>(
      'https://api.openai.com/v1/chat/completions',
      { authorization: `Bearer ${this.apiKey}` },
      {
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_ASSISTENTE },
          { role: 'user', content: montarMensagemUsuario(pergunta, serializarContexto(contexto)) },
        ],
      },
    );

    const texto = dados.choices?.[0]?.message?.content?.trim();
    if (!texto) {
      throw new LlmIndisponivelError('A OpenAI retornou uma resposta vazia.');
    }
    return texto;
  }
}
