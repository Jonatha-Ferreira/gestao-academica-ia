import express, { Express } from 'express';
import cors from 'cors';
import { ListarAlunos } from '../application/use-cases/ListarAlunos';
import { ConsultarAluno } from '../application/use-cases/ConsultarAluno';
import { ConsultarFinanceiro } from '../application/use-cases/ConsultarFinanceiro';
import { ProcessarAssistenteIA } from '../application/use-cases/ProcessarAssistenteIA';
import { TestarIntegracaoIa } from '../application/use-cases/TestarIntegracaoIa';
import { GerenciadorIa } from '../application/services/GerenciadorIa';
import { CacheIdempotencia } from '../application/ports/CacheIdempotencia';
import { criarAlunosRouter } from './routes/alunos.routes';
import { criarAssistenteRouter } from './routes/assistente.routes';
import { criarIaRouter } from './routes/ia.routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

export interface AppDependencies {
  listarAlunos: ListarAlunos;
  consultarAluno: ConsultarAluno;
  consultarFinanceiro: ConsultarFinanceiro;
  processarAssistenteIA: ProcessarAssistenteIA;
  testarIntegracaoIa: TestarIntegracaoIa;
  gerenciadorIa: GerenciadorIa;
  cacheIdempotencia: CacheIdempotencia;
}

export interface AppOptions {
  corsOrigin?: string;
}

/**
 * Monta a aplicação Express a partir das dependências (casos de uso) já
 * resolvidas. Não conhece repositórios nem provedores de IA diretamente,
 * facilitando testes de integração com dublês.
 */
export function createApp(deps: AppDependencies, options: AppOptions = {}): Express {
  const app = express();

  app.use(cors({ origin: options.corsOrigin ?? true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', servico: 'gestao-academica-api' });
  });

  app.use('/api/alunos', criarAlunosRouter(deps));
  app.use('/api/assistente', criarAssistenteRouter(deps));
  app.use('/api/ia', criarIaRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
