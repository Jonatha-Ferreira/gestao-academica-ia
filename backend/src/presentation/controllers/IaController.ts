import { Request, Response } from 'express';
import { GerenciadorIa } from '../../application/services/GerenciadorIa';
import { TestarIntegracaoIa } from '../../application/use-cases/TestarIntegracaoIa';
import { NaoAutorizadoError } from '../../application/errors/AppError';
import { autenticarIaSchema, modelosIaSchema, salvarIaSchema } from '../schemas/ia.schema';
import { asyncHandler } from '../middlewares/asyncHandler';

export class IaController {
  constructor(
    private readonly gerenciadorIa: GerenciadorIa,
    private readonly testarIntegracaoIa: TestarIntegracaoIa,
  ) {}

  /** GET /api/ia/status (público — nunca expõe a chave). */
  status = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ dados: await this.gerenciadorIa.status() });
  });

  /** POST /api/ia/autenticar — valida a senha de administração. */
  autenticar = asyncHandler(async (req: Request, res: Response) => {
    const { senha } = autenticarIaSchema.parse(req.body);
    if (!this.gerenciadorIa.autenticar(senha)) {
      throw new NaoAutorizadoError();
    }
    res.json({ dados: { valido: true } });
  });

  /** GET /api/ia/configuracao (protegido) — configuração atual, sem a chave. */
  configuracao = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ dados: await this.gerenciadorIa.obterConfiguracaoPublica() });
  });

  /** POST /api/ia/modelos (protegido) — lista os modelos do provedor via chave. */
  listarModelos = asyncHandler(async (req: Request, res: Response) => {
    const { provedor, baseUrl, apiKey } = modelosIaSchema.parse(req.body);
    res.json({ dados: await this.gerenciadorIa.listarModelos(provedor, baseUrl ?? '', apiKey) });
  });

  /** PUT /api/ia/configuracao (protegido) — valida e salva a integração. */
  salvar = asyncHandler(async (req: Request, res: Response) => {
    const input = salvarIaSchema.parse(req.body);
    res.json({ dados: await this.gerenciadorIa.salvar(input) });
  });

  /** DELETE /api/ia/configuracao (protegido) — volta ao modo demonstrativo. */
  remover = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ dados: await this.gerenciadorIa.remover() });
  });

  /** POST /api/ia/testar (protegido) — envia uma pergunta de amostra. */
  testar = asyncHandler(async (_req: Request, res: Response) => {
    res.json({ dados: await this.testarIntegracaoIa.executar() });
  });
}
