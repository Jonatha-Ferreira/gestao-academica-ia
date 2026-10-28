import { EntradaLlm, LlmProvider } from '../ports/LlmProvider';
import { InterpretadorResposta, RespostaInterpretada } from '../ports/InterpretadorResposta';
import { comRetry, OpcoesRetry } from './comRetry';

/**
 * Chama o provedor, interpreta a saída estruturada e repete quando:
 *  - o provedor falha de forma transitória (rede/timeout/5xx/resposta vazia); ou
 *  - o modelo responde fora do contrato (JSON inválido).
 *
 * A partir da segunda tentativa, o adapter é avisado (`reforcarFormato`) para
 * insistir no formato — modelo com temperatura > 0 pode variar a saída.
 */
export async function responderComSaidaEstruturada(
  provedor: LlmProvider,
  entrada: EntradaLlm,
  interpretador: InterpretadorResposta,
  retry: OpcoesRetry,
): Promise<RespostaInterpretada> {
  return comRetry(async (tentativa) => {
    const texto = await provedor.responder({
      ...entrada,
      reforcarFormato: tentativa > 1,
    });
    return interpretador.interpretar(texto);
  }, retry);
}
