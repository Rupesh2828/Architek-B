import { AsyncLocalStorage } from 'node:async_hooks';

interface RequestContext {
  requestId: string;
  userId?: string;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export const setContext = (context: RequestContext) => {
  asyncLocalStorage.enterWith(context);
};

export const getContext = (): RequestContext | undefined => {
  return asyncLocalStorage.getStore();
};
