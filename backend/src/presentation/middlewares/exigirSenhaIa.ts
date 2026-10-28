import { RequestHandler } from 'express';
import { GerenciadorIa } from '../../application/services/GerenciadorIa';
import { NaoAutorizadoError } from '../../application/errors/AppError';

/**
 * Exige a senha de administração em rotas que mexem com a integração externa.
 * A senha pode vir no cabeçalho `x-senha-ia` ou no corpo (`senha`).
 */
export function exigirSenhaIa(gerenciador: GerenciadorIa): RequestHandler {
  return (req, _res, next) => {
    const corpo = (req.body ?? {}) as { senha?: unknown };
    const senha = String(req.header('x-senha-ia') ?? corpo.senha ?? '');
    if (!gerenciador.autenticar(senha)) {
      next(new NaoAutorizadoError());
      return;
    }
    next();
  };
}
