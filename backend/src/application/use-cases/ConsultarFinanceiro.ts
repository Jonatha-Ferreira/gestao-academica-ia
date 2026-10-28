import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import {
  ResumoFinanceiro,
  SituacaoFinanceiraService,
} from '../../domain/services/SituacaoFinanceiraService';
import { Clock } from '../ports/Clock';
import { NotFoundError } from '../errors/AppError';

/** Caso de uso: consultar apenas a situação financeira de um aluno. */
export class ConsultarFinanceiro {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(id: string): Promise<ResumoFinanceiro> {
    const aluno = await this.alunos.buscarPorId(id);
    if (!aluno) {
      throw new NotFoundError(`Aluno "${id}" não encontrado.`);
    }
    return SituacaoFinanceiraService.avaliar(aluno, this.clock.hojeISO());
  }
}
