import { z } from 'zod';
import { RespostaInvalidaError } from '../../application/errors/AppError';
import {
  InterpretadorResposta,
  RespostaInterpretada,
} from '../../application/ports/InterpretadorResposta';

const alunoCitadoSchema = z.object({
  nome: z.string().trim().min(1),
  matricula: z.string().trim().min(1),
  valorEmAtraso: z.number().nonnegative().optional(),
});

/** Contrato de saída exigido do modelo (ver `CONTRATO_SAIDA_JSON` nos prompts). */
const respostaSchema = z.object({
  resposta: z.string().trim().min(1),
  adimplentes: z.array(alunoCitadoSchema).default([]),
  inadimplentes: z.array(alunoCitadoSchema).default([]),
});

/** Remove cercas de markdown e recorta até o objeto JSON. */
function extrairJson(texto: string): string {
  const semCerca = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const inicio = semCerca.indexOf('{');
  const fim = semCerca.lastIndexOf('}');
  if (inicio >= 0 && fim > inicio) {
    return semCerca.slice(inicio, fim + 1);
  }
  return semCerca;
}

/**
 * Interpreta a saída do LLM como JSON estruturado. Qualquer desvio do contrato
 * lança `RespostaInvalidaError`, o que dispara o retry (e, no limite, um 502
 * claro em vez de texto inventado na tela).
 */
export class InterpretadorRespostaJson implements InterpretadorResposta {
  interpretar(texto: string): RespostaInterpretada {
    let bruto: unknown;
    try {
      bruto = JSON.parse(extrairJson(texto));
    } catch {
      throw new RespostaInvalidaError('A IA não retornou um JSON válido.');
    }

    const resultado = respostaSchema.safeParse(bruto);
    if (!resultado.success) {
      throw new RespostaInvalidaError('A IA retornou um JSON fora do contrato esperado.');
    }

    return {
      resposta: resultado.data.resposta,
      adimplentes: resultado.data.adimplentes,
      inadimplentes: resultado.data.inadimplentes,
    };
  }
}
