import { Request, Response } from 'express';
import { ProcessarAssistenteIA } from '../../application/use-cases/ProcessarAssistenteIA';
import { assistenteSchema } from '../schemas/assistente.schema';
import { asyncHandler } from '../middlewares/asyncHandler';

export class AssistenteController {
  constructor(private readonly processarAssistenteIA: ProcessarAssistenteIA) {}

  /** POST /api/assistente */
  perguntar = asyncHandler(async (req: Request, res: Response) => {
    const input = assistenteSchema.parse(req.body);
    const resposta = await this.processarAssistenteIA.executar(input);
    res.json({ dados: resposta });
  });
}
