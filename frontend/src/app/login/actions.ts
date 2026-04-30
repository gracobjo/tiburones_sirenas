'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type LoginResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string; role: 'admin' | 'user' };
};

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) throw new Error('Email requerido');

  const backend = process.env.BACKEND_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${backend}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Login fallido');
  }

  const data = (await res.json()) as LoginResponse;
  cookies().set('auth_token', data.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  cookies().set('user_role', data.user.role, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  cookies().set('user_email', data.user.email, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  cookies().delete('auth_token');
  cookies().delete('user_role');
  cookies().delete('user_email');
  redirect('/login');
}

