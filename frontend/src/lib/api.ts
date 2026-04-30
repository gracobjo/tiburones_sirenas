import { cookies } from 'next/headers';

export function backendBaseUrl() {
  // Server-to-server URL (Docker: http://backend:3001/api)
  return process.env.BACKEND_URL ?? 'http://localhost:3001/api';
}

export function backendPublicUrl() {
  // Used for links to uploaded files from the browser
  return process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL ?? 'http://localhost:3001';
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { auth?: boolean },
): Promise<T> {
  const url = `${backendBaseUrl()}${path.startsWith('/') ? '' : '/'}${path}`;
  const token = cookies().get('auth_token')?.value;

  const headers = new Headers(init?.headers);
  if (init?.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

