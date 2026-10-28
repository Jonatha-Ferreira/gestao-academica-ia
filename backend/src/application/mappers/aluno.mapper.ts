import { Aluno } from '../../domain/entities/Aluno';
import { SituacaoFinanceiraService } from '../../domain/services/SituacaoFinanceiraService';
import { AlunoDetalheDTO, AlunoResumoDTO } from '../dtos/aluno.dto';

/** Converte entidades de domínio nos DTOs de saída da aplicação. */
export function toAlunoResumo(aluno: Aluno, dataReferenciaISO: string): AlunoResumoDTO {
  const { situacao } = SituacaoFinanceiraService.avaliar(aluno, dataReferenciaISO);
  return {
    id: aluno.id,
    nome: aluno.nome,
    curso: aluno.curso,
    matricula: aluno.matricula,
    status: aluno.status,
    situacaoFinanceira: situacao,
  };
}

export function toAlunoDetalhe(aluno: Aluno, dataReferenciaISO: string): AlunoDetalheDTO {
  return {
    ...toAlunoResumo(aluno, dataReferenciaISO),
    financeiro: SituacaoFinanceiraService.avaliar(aluno, dataReferenciaISO),
  };
}
