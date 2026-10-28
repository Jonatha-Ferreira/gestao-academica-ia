import { z } from 'zod';

/**
 * Adaptadores aceitos. `openai` cobre QUALQUER provedor compatível com a API da
 * OpenAI (OpenAI, DeepSeek, Groq, OpenRouter, Cohere/Command, Mistral, Ollama...),
 * desde que a URL base seja informada.
 */
export const provedorIaSchema = z.enum(['anthropic', 'openai']);

const baseUrlOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor ? valor : undefined))
  .refine((valor) => valor === undefined || /^https?:\/\/[^\s]+$/.test(valor), {
    message: 'Informe uma URL http(s) válida (ex.: https://api.deepseek.com/v1).',
  });

export const autenticarIaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha de administração.'),
});

export const modelosIaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha de administração.'),
  provedor: provedorIaSchema,
  baseUrl: baseUrlOpcional,
  apiKey: z.string().min(1, 'Informe a chave de API.'),
});

export const salvarIaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha de administração.'),
  provedor: provedorIaSchema,
  rotulo: z.string().trim().max(60, 'Rótulo muito longo.').optional(),
  baseUrl: baseUrlOpcional,
  apiKey: z.string().min(1, 'Informe a chave de API.'),
  modelo: z.string().trim().max(160, 'Nome de modelo muito longo.').optional(),
  promptSistema: z.string().max(8000, 'As regras devem ter no máximo 8000 caracteres.').optional(),
  temperatura: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().max(8000).optional(),
});
