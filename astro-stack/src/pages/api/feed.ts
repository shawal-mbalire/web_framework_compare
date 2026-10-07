import type { APIRoute } from 'astro';
import { getFeed } from '@/lib/posts';

export const GET: APIRoute = async ({ url, locals }) => {
  const page = await getFeed(locals.user?.id ?? null, url.searchParams.get('cursor'));
  return Response.json(page, { headers: { 'Cache-Control': 'no-store' } });
};
