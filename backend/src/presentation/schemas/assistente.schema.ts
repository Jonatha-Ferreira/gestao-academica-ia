import { z } from 'zod';

/** Corpo de POST /api/assistente. */
export const assistenteSchema = z.object({
  pergunta: z
    .string({ required_error: 'O campo "pergunta" é obrigatório.' })
    .trim()
    .min(1, 'A pergunta não pode ser vazia.')
    .max(1000, 'A pergunta deve ter no máximo 1000 caracteres.'),
  alunoId: z.string().trim().min(1).optional(),
});

export type AssistenteInputSchema = z.infer<typeof assistenteSchema>;
