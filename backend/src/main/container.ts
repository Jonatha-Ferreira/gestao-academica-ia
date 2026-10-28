import * as path from 'path';
import { Clock } from '../application/ports/Clock';
import { LlmProvider } from '../application/ports/LlmProvider';
import { CatalogoModelos } from '../application/ports/CatalogoModelos';
import { CacheIdempotencia } from '../application/ports/CacheIdempotencia';
import { InterpretadorResposta } from '../application/ports/InterpretadorResposta';
import { OpcoesRetry } from '../application/services/comRetry';
import { AlunoRepository } from '../domain/repositories/AlunoRepository';
import { ConfiguracaoIaRepository } from '../domain/repositories/ConfiguracaoIaRepository';
import { ListarAlunos } from '../application/use-cases/ListarAlunos';
import { ConsultarAluno } from '../application/use-cases/ConsultarAluno';
import { ConsultarFinanceiro } from '../application/use-cases/ConsultarFinanceiro';
import { ProcessarAssistenteIA } from '../application/use-cases/ProcessarAssistenteIA';
import { TestarIntegracaoIa } from '../application/use-cases/TestarIntegracaoIa';
import { GerenciadorIa } from '../application/services/GerenciadorIa';
import { SystemClock } from '../infrastructure/clock/Clock';
import { InMemoryAlunoRepository } from '../infrastructure/database/InMemoryAlunoRepository';
import { ArquivoConfiguracaoIaRepository } from '../infrastructure/database/ArquivoConfiguracaoIaRepository';
import { createLlmProvider } from '../infrastructure/llm/createLlmProvider';
import { CatalogoModelosHttp } from '../infrastructure/llm/catalogoModelosHttp';
import { montarProvedorIa } from '../infrastructure/llm/montarProvedorIa';
import { InterpretadorRespostaJson } from '../infrastructure/llm/interpretadorRespostaJson';
import { CacheIdempotenciaMemoria } from '../infrastructure/cache/CacheIdempotenciaMemoria';
import { AppDependencies } from '../presentation/app';

/** Retry padrão da saída estruturada (backoff exponencial + jitter). */
export const RETRY_PADRAO: OpcoesRetry = { tentativas: 3, baseMs: 400 };

export interface ContainerOverrides {
  clock?: Clock;
  repository?: AlunoRepository;
  llm?: LlmProvider;
  gerenciadorIa?: GerenciadorIa;
  configuracaoIaRepository?: ConfiguracaoIaRepository;
  catalogoModelos?: CatalogoModelos;
  senhaIa?: string;
  interpretador?: InterpretadorResposta;
  cacheIdempotencia?: CacheIdempotencia;
  retry?: OpcoesRetry;
}

export interface Container {
  dependencias: AppDependencies;
  clock: Clock;
  repository: AlunoRepository;
  gerenciadorIa: GerenciadorIa;
}

function montarGerenciadorIa(overrides: ContainerOverrides): GerenciadorIa {
  if (overrides.gerenciadorIa) {
    return overrides.gerenciadorIa;
  }

  const repositorio =
    overrides.configuracaoIaRepository ??
    new ArquivoConfiguracaoIaRepository(path.resolve(process.cwd(), '.data', 'ia-config.json'));

  return new GerenciadorIa({
    repositorio,
    catalogo: overrides.catalogoModelos ?? new CatalogoModelosHttp(),
    montarProvedor: montarProvedorIa,
    provedorFallback: overrides.llm ?? createLlmProvider(),
    senhaAdmin: overrides.senhaIa ?? process.env.IA_ADMIN_PASSWORD ?? 'admin',
  });
}

/**
 * Composition root: única parte do sistema que conhece as implementações
 * concretas e as injeta nos casos de uso. Nos testes, os dublês entram aqui.
 */
export function buildContainer(overrides: ContainerOverrides = {}): Container {
  const clock = overrides.clock ?? new SystemClock();
  const repository = overrides.repository ?? new InMemoryAlunoRepository();
  const gerenciadorIa = montarGerenciadorIa(overrides);

  const interpretador = overrides.interpretador ?? new InterpretadorRespostaJson();
  const cacheIdempotencia = overrides.cacheIdempotencia ?? new CacheIdempotenciaMemoria();
  const retry = overrides.retry ?? RETRY_PADRAO;

  const dependencias: AppDependencies = {
    listarAlunos: new ListarAlunos(repository, clock),
    consultarAluno: new ConsultarAluno(repository, clock),
    consultarFinanceiro: new ConsultarFinanceiro(repository, clock),
    processarAssistenteIA: new ProcessarAssistenteIA(
      repository,
      clock,
      gerenciadorIa,
      interpretador,
      retry,
    ),
    testarIntegracaoIa: new TestarIntegracaoIa(
      repository,
      clock,
      gerenciadorIa,
      interpretador,
      retry,
    ),
    gerenciadorIa,
    cacheIdempotencia,
  };

  return { dependencias, clock, repository, gerenciadorIa };
}
