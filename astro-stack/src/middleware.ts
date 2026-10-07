import { defineMiddleware } from 'astro:middleware';
import { readSession } from '@/lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = await readSession(context.cookies);
  return next();
});
