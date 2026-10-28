import { Router } from 'express';
import { ProcessarAssistenteIA } from '../../application/use-cases/ProcessarAssistenteIA';
import { CacheIdempotencia } from '../../application/ports/CacheIdempotencia';
import { AssistenteController } from '../controllers/AssistenteController';

export interface AssistenteRouterDeps {
  processarAssistenteIA: ProcessarAssistenteIA;
  cacheIdempotencia: CacheIdempotencia;
}

export function criarAssistenteRouter(deps: AssistenteRouterDeps): Router {
  const router = Router();
  const controller = new AssistenteController(deps.processarAssistenteIA, deps.cacheIdempotencia);

  router.post('/', controller.perguntar);

  return router;
}
