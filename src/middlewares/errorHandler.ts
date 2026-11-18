import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {          // mongoose schema validation
    statusCode = 400;
    message = Object.values(err.errors).map((e: any) => e.message).join(', ');
  } else if (err.name === 'CastError') {                // bad ObjectId etc.
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {                      // unique index violation
    statusCode = 409;
    message = `Duplicate value for: ${Object.keys(err.keyValue).join(', ')}`;
  } else {
    console.error(err);
  }

  res.status(statusCode).json({ success: false, message });
};