import { LlmProvider } from './LlmProvider';

/**
 * Resolve, a cada requisição, qual provedor de LLM está ativo. Permite trocar a
 * integração (real x demonstrativo) em tempo de execução, sem reiniciar a API.
 */
export interface ResolvedorProvedorIa {
  obterProvedor(): Promise<LlmProvider>;
  /**
   * Rótulo de exibição do provedor ativo (ex.: "Command Code", "OpenAI").
   * `null` quando nada está configurado (modo demonstrativo).
   */
  obterRotulo(): Promise<string | null>;
}
