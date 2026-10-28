import { Router } from 'express';
import { ListarAlunos } from '../../application/use-cases/ListarAlunos';
import { ConsultarAluno } from '../../application/use-cases/ConsultarAluno';
import { ConsultarFinanceiro } from '../../application/use-cases/ConsultarFinanceiro';
import { AlunoController } from '../controllers/AlunoController';

export interface AlunosRouterDeps {
  listarAlunos: ListarAlunos;
  consultarAluno: ConsultarAluno;
  consultarFinanceiro: ConsultarFinanceiro;
}

export function criarAlunosRouter(deps: AlunosRouterDeps): Router {
  const router = Router();
  const controller = new AlunoController(
    deps.listarAlunos,
    deps.consultarAluno,
    deps.consultarFinanceiro,
  );

  router.get('/', controller.listar);
  router.get('/:id/financeiro', controller.buscarFinanceiro);
  router.get('/:id', controller.detalhar);

  return router;
}
