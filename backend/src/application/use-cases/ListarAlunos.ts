import { AlunoRepository } from '../../domain/repositories/AlunoRepository';
import { Clock } from '../ports/Clock';
import { AlunoResumoDTO } from '../dtos/aluno.dto';
import { toAlunoResumo } from '../mappers/aluno.mapper';

export interface ListarAlunosInput {
  /** Busca por nome (parcial) ou matrícula. */
  busca?: string;
}

/** Caso de uso: listar alunos, opcionalmente filtrando por nome/matrícula. */
export class ListarAlunos {
  constructor(
    private readonly alunos: AlunoRepository,
    private readonly clock: Clock,
  ) {}

  async executar(input: ListarAlunosInput = {}): Promise<AlunoResumoDTO[]> {
    const termo = input.busca?.trim();
    const encontrados = termo ? await this.alunos.buscar(termo) : await this.alunos.listar();
    const hoje = this.clock.hojeISO();
    return encontrados.map((aluno) => toAlunoResumo(aluno, hoje));
  }
}
