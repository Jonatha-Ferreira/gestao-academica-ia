/**
 * Erro de regra de negócio do domínio. Não conhece HTTP nem frameworks.
 * É traduzido para uma resposta adequada na camada de apresentação.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
