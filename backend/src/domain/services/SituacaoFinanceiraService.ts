import { Aluno } from '../entities/Aluno';
import { Mensalidade } from '../entities/Mensalidade';
import { centavosParaReais } from '../../shared/money';

export type SituacaoFinanceira = 'adimplente' | 'inadimplente';
export type SituacaoParcela = 'paga' | 'aberta' | 'atrasada';

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

/**
 * Serviço de domínio puro (sem I/O, sem framework) responsável por determinar a
 * situação financeira de um aluno a partir dos pagamentos e vencimentos.
 *
 * É a peça central da correção de sustentação: o aluno é INADIMPLENTE quando
 * possui ao menos uma parcela vencida e não paga. Uma parcela apenas "em aberto"
 * (ainda dentro do prazo) NÃO torna o aluno inadimplente.
 */
export class SituacaoFinanceiraService {
  static avaliar(aluno: Aluno, dataReferenciaISO: string): ResumoFinanceiro {
    const parcelas = aluno.listaMensalidades
      .map((mensalidade) => SituacaoFinanceiraService.avaliarParcela(mensalidade, dataReferenciaISO))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

    const pagas = parcelas.filter((p) => p.situacao === 'paga');
    const emAberto = parcelas.filter((p) => p.situacao === 'aberta');
    const emAtraso = parcelas.filter((p) => p.situacao === 'atrasada');

    const soma = (lista: ParcelaResumo[]) =>
      lista.reduce((total, p) => total + p.valorEmCentavos, 0);

    const naoPagas = [...emAberto, ...emAtraso];

    return {
      situacao: emAtraso.length > 0 ? 'inadimplente' : 'adimplente',
      totalParcelas: parcelas.length,
      parcelasPagas: pagas.length,
      parcelasEmAberto: emAberto.length,
      parcelasEmAtraso: emAtraso.length,
      valorTotalEmCentavos: soma(parcelas),
      valorPagoEmCentavos: soma(pagas),
      valorEmAbertoEmCentavos: soma(naoPagas),
      valorEmAtrasoEmCentavos: soma(emAtraso),
      proximoVencimento: naoPagas.length > 0 ? naoPagas[0]!.vencimento : null,
      parcelas,
    };
  }

  private static avaliarParcela(
    mensalidade: Mensalidade,
    dataReferenciaISO: string,
  ): ParcelaResumo {
    let situacao: SituacaoParcela;
    if (mensalidade.pago) {
      situacao = 'paga';
    } else if (mensalidade.estaEmAtraso(dataReferenciaISO)) {
      situacao = 'atrasada';
    } else {
      situacao = 'aberta';
    }

    return {
      id: mensalidade.id,
      competencia: mensalidade.competencia,
      vencimento: mensalidade.vencimento,
      valor: centavosParaReais(mensalidade.valorEmCentavos),
      valorEmCentavos: mensalidade.valorEmCentavos,
      pago: mensalidade.pago,
      dataPagamento: mensalidade.dataPagamento,
      situacao,
    };
  }
}
