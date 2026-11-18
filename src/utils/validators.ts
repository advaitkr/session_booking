import { Types } from 'mongoose';
import { AppError } from './AppError';

export const assertObjectId = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !Types.ObjectId.isValid(value)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
  return value;
};