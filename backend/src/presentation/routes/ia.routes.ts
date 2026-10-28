import { Router } from 'express';
import { GerenciadorIa } from '../../application/services/GerenciadorIa';
import { TestarIntegracaoIa } from '../../application/use-cases/TestarIntegracaoIa';
import { IaController } from '../controllers/IaController';
import { exigirSenhaIa } from '../middlewares/exigirSenhaIa';

export interface IaRouterDeps {
  gerenciadorIa: GerenciadorIa;
  testarIntegracaoIa: TestarIntegracaoIa;
}

export function criarIaRouter(deps: IaRouterDeps): Router {
  const router = Router();
  const controller = new IaController(deps.gerenciadorIa, deps.testarIntegracaoIa);
  const protegido = exigirSenhaIa(deps.gerenciadorIa);

  router.get('/status', controller.status);
  router.post('/autenticar', controller.autenticar);

  router.get('/configuracao', protegido, controller.configuracao);
  router.put('/configuracao', protegido, controller.salvar);
  router.delete('/configuracao', protegido, controller.remover);
  router.post('/modelos', protegido, controller.listarModelos);
  router.post('/testar', protegido, controller.testar);

  return router;
}
