import { SituacaoFinanceira, SituacaoParcela } from '../../domain/services/SituacaoFinanceiraService';

/**
 * Contexto enxuto enviado ao modelo de IA. Contém SOMENTE os dados acadêmicos
 * fictícios necessários para responder às perguntas — nada de credenciais,
 * dados pessoais reais ou campos internos.
 */
export interface MensalidadeContexto {
  competencia: string;
  vencimento: string;
  valor: number;
  situacao: SituacaoParcela;
}

export interface AlunoContexto {
  id: string;
  nome: string;
  curso: string;
  matricula: string;
  status: string;
  situacaoFinanceira: SituacaoFinanceira;
  resumo: {
    parcelasPagas: number;
    parcelasEmAberto: number;
    parcelasEmAtraso: number;
    valorEmAberto: number;
    valorEmAtraso: number;
    proximoVencimento: string | null;
  };
  mensalidades: MensalidadeContexto[];
}

export interface ContextoAcademico {
  dataReferencia: string;
  totalAlunos: number;
  alunos: AlunoContexto[];
}
