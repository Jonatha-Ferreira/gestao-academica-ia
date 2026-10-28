import { ModoLlm } from '../ports/LlmProvider';

export interface ProcessarAssistenteInput {
  pergunta: string;
  /** Opcional: restringe o contexto a um único aluno (detalhe do aluno). */
  alunoId?: string;
}

export interface RespostaAssistenteDTO {
  resposta: string;
  provedor: string;
  modo: ModoLlm;
  geradoEm: string;
}
