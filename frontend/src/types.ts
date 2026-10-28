export type SituacaoFinanceira = 'adimplente' | 'inadimplente';
export type SituacaoParcela = 'paga' | 'aberta' | 'atrasada';
export type ModoLlm = 'real' | 'demonstrativo';

export interface AlunoResumo {
  id: string;
  nome: string;
  curso: string;
  matricula: string;
  status: string;
  situacaoFinanceira: SituacaoFinanceira;
}

export interface ParcelaResumo {
  id: string;
  competencia: string;
  vencimento: string;
  valor: number;
  valorEmCentavos: number;
  pago: boolean;
  dataPagamento: string | null;
  situacao: SituacaoParcela;
}

export interface ResumoFinanceiro {
  situacao: SituacaoFinanceira;
  totalParcelas: number;
  parcelasPagas: number;
  parcelasEmAberto: number;
  parcelasEmAtraso: number;
  valorTotalEmCentavos: number;
  valorPagoEmCentavos: number;
  valorEmAbertoEmCentavos: number;
  valorEmAtrasoEmCentavos: number;
  proximoVencimento: string | null;
  parcelas: ParcelaResumo[];
}

export interface AlunoDetalhe extends AlunoResumo {
  financeiro: ResumoFinanceiro;
}

export interface RespostaAssistente {
  resposta: string;
  provedor: string;
  modo: ModoLlm;
  geradoEm: string;
}
