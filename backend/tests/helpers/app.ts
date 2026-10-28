import { Express } from 'express';
import { createApp } from '../../src/presentation/app';
import { buildContainer } from '../../src/main/container';
import { FixedClock } from '../../src/infrastructure/clock/Clock';
import { DemoProvider } from '../../src/infrastructure/llm/DemoProvider';
import { LlmProvider } from '../../src/application/ports/LlmProvider';

/** Data de referência fixa para tornar os testes determinísticos. */
export const DATA_REFERENCIA_TESTE = '2026-10-28';

export function criarAppDeTeste(llm: LlmProvider = new DemoProvider()): Express {
  const container = buildContainer({
    clock: new FixedClock(DATA_REFERENCIA_TESTE),
    llm,
  });
  return createApp(container.dependencias);
}
