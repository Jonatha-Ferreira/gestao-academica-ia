/**
 * Erros esperados da camada de aplicação. Carregam o status HTTP e um código
 * estável, permitindo que a apresentação responda adequadamente sem vazar
 * detalhes internos.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly codigo: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NAO_ENCONTRADO');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDACAO');
  }
}

export class LlmIndisponivelError extends AppError {
  constructor(message: string) {
    super(message, 503, 'IA_INDISPONIVEL');
  }
}

/** Senha de administração ausente ou incorreta. */
export class NaoAutorizadoError extends AppError {
  constructor(message = 'Senha de administração inválida.') {
    super(message, 401, 'NAO_AUTORIZADO');
  }
}

/** Configuração de provedor inválida (chave/modelo/provedor). */
export class ProvedorInvalidoError extends AppError {
  constructor(message: string) {
    super(message, 400, 'PROVEDOR_INVALIDO');
  }
}
