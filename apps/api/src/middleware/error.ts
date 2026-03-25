import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../lib/errors';
import { ZodError } from 'zod';

// Wrap async route handlers to catch errors and pass to errorHandler
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('[Error]', err.message);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
