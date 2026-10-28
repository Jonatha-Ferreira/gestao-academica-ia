import { LlmProvider } from './LlmProvider';

/**
 * Resolve, a cada requisição, qual provedor de LLM está ativo. Permite trocar a
 * integração (real x demonstrativo) em tempo de execução, sem reiniciar a API.
 */
export interface ResolvedorProvedorIa {
  obterProvedor(): Promise<LlmProvider>;
}
