import { SituacaoFinanceira, ResumoFinanceiro } from '../../domain/services/SituacaoFinanceiraService';
import { StatusMatricula } from '../../domain/entities/Aluno';

/** Item de listagem: dados do aluno + situação financeira já calculada. */
export interface AlunoResumoDTO {
  id: string;
  nome: string;
  curso: string;
  matricula: string;
  status: StatusMatricula;
  situacaoFinanceira: SituacaoFinanceira;
}

/** Detalhe do aluno: resumo + o financeiro completo. */
export interface AlunoDetalheDTO extends AlunoResumoDTO {
  financeiro: ResumoFinanceiro;
}
