import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { AlunoDetalheDTO } from '../dtos/aluno.dto';
import { toAlunoDetalhe } from '../mappers/aluno.mapper';
import { NotFoundError } from '../errors/AppError';

/** Caso de uso: consultar um aluno específico com o detalhe financeiro. */
export class ConsultarAluno {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(id: string): Promise<AlunoDetalheDTO> {
    const aluno = await this.alunos.buscarPorId(id);
    if (!aluno) {
      throw new NotFoundError(`Aluno "${id}" não encontrado.`);
    }
    return toAlunoDetalhe(aluno, this.clock.hojeISO());
  }
}
