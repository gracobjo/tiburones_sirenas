'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function backend() {
  return process.env.BACKEND_URL ?? 'http://localhost:3001/api';
}

function authHeader() {
  const token = cookies().get('auth_token')?.value;
  if (!token) throw new Error('No autenticado');
  return { Authorization: `Bearer ${token}` };
}

export async function createBetAction(formData: FormData) {
  const res = await fetch(`${backend()}/bets`, {
    method: 'POST',
    headers: authHeader(),
    body: formData,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error creando apuesta'));
  revalidatePath('/dashboard');
}

export async function updateBetStatusAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const prizeAmountEur = String(formData.get('prizeAmountEur') ?? '').trim();
  const prizeAmount = prizeAmountEur ? Math.round(Number(prizeAmountEur) * 100) : undefined;

  const res = await fetch(`${backend()}/bets/${id}`, {
    method: 'PATCH',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, prizeAmount }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error actualizando apuesta'));
  revalidatePath('/dashboard');
}

export async function createTransactionAction(formData: FormData) {
  const type = String(formData.get('type') ?? '');
  const amountEur = String(formData.get('amountEur') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const amount = Math.round(Number(amountEur) * 100);

  const res = await fetch(`${backend()}/transactions`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, amount, description: description || undefined }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error creando movimiento'));
  revalidatePath('/dashboard');
}

