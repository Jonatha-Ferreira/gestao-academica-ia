import { z } from 'zod';

/** Query string de GET /api/alunos. */
export const listarAlunosQuerySchema = z.object({
  busca: z.string().trim().max(120, 'Busca muito longa (máx. 120 caracteres).').optional(),
});

/** Parâmetros de rota com :id. */
export const alunoParamsSchema = z.object({
  id: z.string().trim().min(1, 'O id do aluno é obrigatório.'),
});
