import { ModoLlm } from '../ports/LlmProvider';

export interface ProcessarAssistenteInput {
  pergunta: string;
  /** Opcional: restringe o contexto a um único aluno (detalhe do aluno). */
  alunoId?: string;
}

/** Aluno citado na resposta estruturada. */
export interface AlunoCitadoDTO {
  nome: string;
  matricula: string;
  /** Presente quando o aluno aparece em `inadimplentes` (valor em reais). */
  valorEmAtraso?: number;
}

export interface RespostaAssistenteDTO {
  resposta: string;
  /** Lista estruturada validada contra o contexto — não vem de texto livre. */
  adimplentes: AlunoCitadoDTO[];
  inadimplentes: AlunoCitadoDTO[];
  provedor: string;
  /** Rótulo amigável do provedor (ex.: "Command Code"); null no demonstrativo. */
  rotulo: string | null;
  modo: ModoLlm;
  geradoEm: string;
}
