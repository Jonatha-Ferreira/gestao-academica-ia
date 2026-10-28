import { ContextoAcademico } from '../dtos/contexto.dto';

export type ModoLlm = 'real' | 'demonstrativo';

export interface EntradaLlm {
  pergunta: string;
  contexto: ContextoAcademico;
  /** Pede ao adapter para insistir no formato obrigatório (usado em retry). */
  reforcarFormato?: boolean;
}

/**
 * Porta do provedor de LLM. As implementações reais (Anthropic/OpenAI) e o modo
 * demonstrativo (local) obedecem a este contrato, permitindo trocar de provedor
 * sem alterar os casos de uso.
 */
export interface LlmProvider {
  readonly nome: string;
  readonly modo: ModoLlm;
  responder(entrada: EntradaLlm): Promise<string>;
}
