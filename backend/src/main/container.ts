import { Clock } from '../application/ports/Clock';
import { LlmProvider } from '../application/ports/LlmProvider';
import { AlunoRepository } from '../domain/repositories/AlunoRepository';
import { ListarAlunos } from '../application/use-cases/ListarAlunos';
import { ConsultarAluno } from '../application/use-cases/ConsultarAluno';
import { ConsultarFinanceiro } from '../application/use-cases/ConsultarFinanceiro';
import { ProcessarAssistenteIA } from '../application/use-cases/ProcessarAssistenteIA';
import { SystemClock } from '../infrastructure/clock/Clock';
import { InMemoryAlunoRepository } from '../infrastructure/database/InMemoryAlunoRepository';
import { createLlmProvider } from '../infrastructure/llm/createLlmProvider';
import { AppDependencies } from '../presentation/app';

export interface ContainerOverrides {
  clock?: Clock;
  repository?: AlunoRepository;
  llm?: LlmProvider;
}

export interface Container {
  dependencias: AppDependencies;
  clock: Clock;
  repository: AlunoRepository;
  llm: LlmProvider;
}

/**
 * Composition root: única parte do sistema que conhece as implementações
 * concretas e as injeta nos casos de uso. Nos testes, os dublês entram aqui.
 */
export function buildContainer(overrides: ContainerOverrides = {}): Container {
  const clock = overrides.clock ?? new SystemClock();
  const repository = overrides.repository ?? new InMemoryAlunoRepository();
  const llm = overrides.llm ?? createLlmProvider();

  const dependencias: AppDependencies = {
    listarAlunos: new ListarAlunos(repository, clock),
    consultarAluno: new ConsultarAluno(repository, clock),
    consultarFinanceiro: new ConsultarFinanceiro(repository, clock),
    processarAssistenteIA: new ProcessarAssistenteIA(repository, clock, llm),
  };

  return { dependencias, clock, repository, llm };
}
