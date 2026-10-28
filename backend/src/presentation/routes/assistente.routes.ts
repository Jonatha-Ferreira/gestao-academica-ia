import { Router } from 'express';
import { ProcessarAssistenteIA } from '../../application/use-cases/ProcessarAssistenteIA';
import { AssistenteController } from '../controllers/AssistenteController';

export interface AssistenteRouterDeps {
  processarAssistenteIA: ProcessarAssistenteIA;
}

export function criarAssistenteRouter(deps: AssistenteRouterDeps): Router {
  const router = Router();
  const controller = new AssistenteController(deps.processarAssistenteIA);

  router.post('/', controller.perguntar);

  return router;
}
