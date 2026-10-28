import { Request, Response } from 'express';
import { ListarAlunos } from '../../application/use-cases/ListarAlunos';
import { ConsultarAluno } from '../../application/use-cases/ConsultarAluno';
import { ConsultarFinanceiro } from '../../application/use-cases/ConsultarFinanceiro';
import { listarAlunosQuerySchema, alunoParamsSchema } from '../schemas/aluno.schema';
import { asyncHandler } from '../middlewares/asyncHandler';

export class AlunoController {
  constructor(
    private readonly listarAlunos: ListarAlunos,
    private readonly consultarAluno: ConsultarAluno,
    private readonly consultarFinanceiro: ConsultarFinanceiro,
  ) {}

  /** GET /api/alunos?busca=... */
  listar = asyncHandler(async (req: Request, res: Response) => {
    const { busca } = listarAlunosQuerySchema.parse(req.query);
    const alunos = await this.listarAlunos.executar({ busca });
    res.json({ dados: alunos, total: alunos.length });
  });

  /** GET /api/alunos/:id */
  detalhar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = alunoParamsSchema.parse(req.params);
    const aluno = await this.consultarAluno.executar(id);
    res.json({ dados: aluno });
  });

  /** GET /api/alunos/:id/financeiro */
  buscarFinanceiro = asyncHandler(async (req: Request, res: Response) => {
    const { id } = alunoParamsSchema.parse(req.params);
    const financeiro = await this.consultarFinanceiro.executar(id);
    res.json({ dados: financeiro });
  });
}
