import { Express } from 'express';
import { createApp } from '../../src/presentation/app';
import { buildContainer } from '../../src/main/container';
import { FixedClock } from '../../src/infrastructure/clock/Clock';
import { DemoProvider } from '../../src/infrastructure/llm/DemoProvider';
import { MemoriaConfiguracaoIaRepository } from '../../src/infrastructure/database/MemoriaConfiguracaoIaRepository';
import { LlmProvider } from '../../src/application/ports/LlmProvider';

/** Data de referência fixa para tornar os testes determinísticos. */
export const DATA_REFERENCIA_TESTE = '2026-10-28';
export const SENHA_IA_TESTE = 'senha-teste';

export function criarAppDeTeste(llm: LlmProvider = new DemoProvider()): Express {
  const container = buildContainer({
    clock: new FixedClock(DATA_REFERENCIA_TESTE),
    llm,
    // Repositório em memória: garante que nenhum teste leia um .data/ real.
    configuracaoIaRepository: new MemoriaConfiguracaoIaRepository(),
    senhaIa: SENHA_IA_TESTE,
  });
  return createApp(container.dependencias);
}
