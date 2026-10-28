import { DomainError } from '../errors/DomainError';
import { ehDataISO } from '../../shared/date';

export interface MensalidadeProps {
  id: string;
  competencia: string;
  vencimento: string;
  valorEmCentavos: number;
  pago: boolean;
  dataPagamento?: string | null;
}

/**
 * Entidade de domínio que representa uma mensalidade/parcela.
 * Concentra a regra primitiva de atraso usada pela avaliação financeira.
 */
export class Mensalidade {
  private constructor(private readonly props: MensalidadeProps) {}

  static criar(props: MensalidadeProps): Mensalidade {
    if (!props.id) {
      throw new DomainError('Mensalidade precisa de id.');
    }
    if (!ehDataISO(props.vencimento)) {
      throw new DomainError(
        `Vencimento inválido em ${props.id}: esperado YYYY-MM-DD, recebido "${props.vencimento}".`,
      );
    }
    if (!Number.isInteger(props.valorEmCentavos) || props.valorEmCentavos <= 0) {
      throw new DomainError(`Valor inválido em ${props.id}: deve ser inteiro positivo em centavos.`);
    }
    if (props.pago && !props.dataPagamento) {
      throw new DomainError(`Mensalidade ${props.id} marcada como paga, mas sem dataPagamento.`);
    }

    return new Mensalidade({ ...props, dataPagamento: props.dataPagamento ?? null });
  }

  get id(): string {
    return this.props.id;
  }

  get competencia(): string {
    return this.props.competencia;
  }

  get vencimento(): string {
    return this.props.vencimento;
  }

  get valorEmCentavos(): number {
    return this.props.valorEmCentavos;
  }

  get pago(): boolean {
    return this.props.pago;
  }

  get dataPagamento(): string | null {
    return this.props.dataPagamento ?? null;
  }

  /**
   * REGRA CORRIGIDA (item 4 do desafio - sustentação).
   *
   * Uma parcela está EM ATRASO somente quando as DUAS condições são verdadeiras:
   *   1. não foi paga; e
   *   2. o vencimento já passou em relação à data de referência.
   *
   * A comparação de datas é feita como texto ISO (YYYY-MM-DD), que é ordenado
   * lexicograficamente na mesma ordem que cronologicamente, garantindo um
   * resultado determinístico e imune a problemas de fuso horário.
   *
   * O bug original considerava apenas "existe mensalidade em aberto" (ou olhava
   * o campo errado), marcando como adimplente um aluno com parcela vencida.
   */
  estaEmAtraso(dataReferenciaISO: string): boolean {
    return !this.props.pago && this.props.vencimento < dataReferenciaISO;
  }

  toJSON(): MensalidadeProps {
    return { ...this.props };
  }
}
