import { STATUS_CODES } from 'node:http';

/** An error that already knows which HTTP status to answer with. */
export class AppError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }

  get error(): string {
    return STATUS_CODES[this.statusCode] ?? 'Error';
  }
}

export const badRequest = (message: string) => new AppError(400, message);
export const notFound = (message: string) => new AppError(404, message);
