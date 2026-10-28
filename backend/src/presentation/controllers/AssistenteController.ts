import { Request, Response } from 'express';
import { ProcessarAssistenteIA } from '../../application/use-cases/ProcessarAssistenteIA';
import { CacheIdempotencia } from '../../application/ports/CacheIdempotencia';
import { assistenteSchema } from '../schemas/assistente.schema';
import { asyncHandler } from '../middlewares/asyncHandler';

export class AssistenteController {
  constructor(
    private readonly processarAssistenteIA: ProcessarAssistenteIA,
    private readonly cacheIdempotencia: CacheIdempotencia,
  ) {}

  /**
   * POST /api/assistente
   *
   * Idempotência por sessão: quando o cliente envia `X-Session-Id` e
   * `Idempotency-Key`, a mesma chave devolve o MESMO resultado (inclusive em
   * chamadas concorrentes), sem duplicar a mensagem nem chamar o modelo duas vezes.
   */
  perguntar = asyncHandler(async (req: Request, res: Response) => {
    const input = assistenteSchema.parse(req.body);

    const sessao = (req.header('x-session-id') ?? '').trim().slice(0, 120);
    const chave = (req.header('idempotency-key') ?? '').trim().slice(0, 120);

    const executar = () => this.processarAssistenteIA.executar(input);

    const resposta =
      sessao && chave
        ? await this.cacheIdempotencia.executar(`${sessao}:${chave}`, executar)
        : await executar();

    res.json({ dados: resposta });
  });
}
