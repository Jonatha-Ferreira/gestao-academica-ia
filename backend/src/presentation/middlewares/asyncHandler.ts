import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Encapsula handlers assíncronos para que rejeições cheguem ao middleware de
 * erro do Express (o Express 4 não faz isso automaticamente).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
