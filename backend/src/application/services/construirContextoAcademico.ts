import { Aluno } from '../../domain/entities/Aluno';
import { SituacaoFinanceiraService } from '../../domain/services/SituacaoFinanceiraService';
import { centavosParaReais } from '../../shared/money';
import { ContextoAcademico } from '../dtos/contexto.dto';

/**
 * Monta o contexto acadêmico (dados fictícios) que será enviado ao LLM.
 * Mantém a informação mínima e já processada para reduzir tokens e evitar que o
 * modelo precise "adivinhar" a situação financeira — assim ele tende a não
 * inventar dados.
 */
export function construirContextoAcademico(
  alunos: Aluno[],
  dataReferenciaISO: string,
): ContextoAcademico {
  const alunosContexto = alunos.map((aluno) => {
    const resumo = SituacaoFinanceiraService.avaliar(aluno, dataReferenciaISO);
    return {
      id: aluno.id,
      nome: aluno.nome,
      curso: aluno.curso,
      matricula: aluno.matricula,
      status: aluno.status,
      situacaoFinanceira: resumo.situacao,
      resumo: {
        parcelasPagas: resumo.parcelasPagas,
        parcelasEmAberto: resumo.parcelasEmAberto,
        parcelasEmAtraso: resumo.parcelasEmAtraso,
        valorEmAberto: centavosParaReais(resumo.valorEmAbertoEmCentavos),
        valorEmAtraso: centavosParaReais(resumo.valorEmAtrasoEmCentavos),
        proximoVencimento: resumo.proximoVencimento,
      },
      mensalidades: resumo.parcelas.map((parcela) => ({
        competencia: parcela.competencia,
        vencimento: parcela.vencimento,
        valor: parcela.valor,
        situacao: parcela.situacao,
      })),
    };
  });

  return {
    dataReferencia: dataReferenciaISO,
    totalAlunos: alunosContexto.length,
    alunos: alunosContexto,
  };
}
