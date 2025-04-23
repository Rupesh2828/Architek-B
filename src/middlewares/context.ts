import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncLocalStorage } from '../utils/request-context';

export function contextMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();

  asyncLocalStorage.run({ requestId }, () => {
    next();
  });
}
