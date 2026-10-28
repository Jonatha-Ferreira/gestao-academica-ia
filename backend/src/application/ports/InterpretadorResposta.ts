import { AlunoCitadoDTO } from '../dtos/assistente.dto';

/**
 * Resposta da IA já validada em um contrato de dados — em vez de confiar em
 * texto livre. É o que permite detectar omissão/invenção e renderizar de forma
 * estruturada na interface.
 */
export interface RespostaInterpretada {
  resposta: string;
  adimplentes: AlunoCitadoDTO[];
  inadimplentes: AlunoCitadoDTO[];
}

/**
 * Converte o texto cru devolvido pelo LLM em `RespostaInterpretada`, lançando
 * `RespostaInvalidaError` quando o contrato não é respeitado (o que dispara o
 * retry).
 */
export interface InterpretadorResposta {
  interpretar(texto: string): RespostaInterpretada;
}
