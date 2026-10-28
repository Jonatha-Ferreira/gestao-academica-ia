import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../application/errors/AppError';
import { DomainError } from '../../domain/errors/DomainError';

/** Resposta padronizada para qualquer rota inexistente. */
export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    erro: {
      codigo: 'ROTA_NAO_ENCONTRADA',
      mensagem: `Rota ${req.method} ${req.originalUrl} não encontrada.`,
    },
  });
};

/**
 * Tratamento centralizado de erros: traduz erros de domínio, de aplicação e de
 * validação (Zod) em respostas HTTP adequadas, sem vazar stack traces.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      erro: {
        codigo: 'VALIDACAO',
        mensagem: 'Dados de entrada inválidos.',
        detalhes: err.issues.map((issue) => ({
          campo: issue.path.join('.') || '(raiz)',
          mensagem: issue.message,
        })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      erro: { codigo: err.codigo, mensagem: err.message },
    });
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json({
      erro: { codigo: 'DOMINIO', mensagem: err.message },
    });
    return;
  }

  console.error('[erro não tratado]', err);
  res.status(500).json({
    erro: { codigo: 'INTERNO', mensagem: 'Erro interno inesperado.' },
  });
};
