import { z } from 'zod';

/** Provedores aceitos: apenas LLMs Anthropic e OpenAI. */
export const provedorIaSchema = z.enum(['anthropic', 'openai']);

export const autenticarIaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha de administração.'),
});

export const modelosIaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha de administração.'),
  provedor: provedorIaSchema,
  apiKey: z.string().min(1, 'Informe a chave de API.'),
});

export const salvarIaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha de administração.'),
  provedor: provedorIaSchema,
  apiKey: z.string().min(1, 'Informe a chave de API.'),
  modelo: z.string().trim().min(1, 'Selecione um modelo.'),
  promptSistema: z.string().max(8000, 'As regras devem ter no máximo 8000 caracteres.').optional(),
  temperatura: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8000).optional(),
});
