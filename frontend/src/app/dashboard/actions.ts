'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function backend() {
  return process.env.BACKEND_URL ?? 'http://localhost:3001/api';
}

function parseEurToCents(input: string) {
  const raw = input.trim();
  if (!raw) throw new Error('Importe requerido');

  // Acepta coma decimal (ej: -600,00) y punto decimal.
  const normalized = raw.replace(',', '.');
  const eur = Number(normalized);
  if (!Number.isFinite(eur)) throw new Error('Importe inválido');

  return Math.round(eur * 100);
}

async function authHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) throw new Error('No autenticado');
  return { Authorization: `Bearer ${token}` };
}

export async function createBetAction(formData: FormData) {
  const res = await fetch(`${backend()}/bets`, {
    method: 'POST',
    headers: await authHeader(),
    body: formData,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error creando apuesta'));
  revalidatePath('/dashboard');
}

export async function updateBetAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const betCode = String(formData.get('betCode') ?? '').trim();
  const amountEur = String(formData.get('amountEur') ?? '').trim();
  const date = String(formData.get('date') ?? '').trim();

  if (!id) throw new Error('ID requerido');

  const body: Record<string, unknown> = {};
  if (betCode) body.betCode = betCode;
  if (amountEur) body.amount = parseEurToCents(amountEur);
  if (date) body.date = date;

  const res = await fetch(`${backend()}/bets/${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error modificando apuesta'));
  revalidatePath('/dashboard');
}

export async function updateBetStatusAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const prizeAmountEur = String(formData.get('prizeAmountEur') ?? '').trim();
  const prizeAmount = prizeAmountEur ? parseEurToCents(prizeAmountEur) : undefined;

  const res = await fetch(`${backend()}/bets/${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, prizeAmount }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error actualizando apuesta'));
  revalidatePath('/dashboard');
}

export async function deleteBetAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('ID requerido');

  const res = await fetch(`${backend()}/bets/${id}`, {
    method: 'DELETE',
    headers: await authHeader(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error borrando apuesta'));
  revalidatePath('/dashboard');
}

export async function createTransactionAction(formData: FormData) {
  const type = String(formData.get('type') ?? '');
  const amountEur = String(formData.get('amountEur') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const amount = parseEurToCents(amountEur);

  const res = await fetch(`${backend()}/transactions`, {
    method: 'POST',
    headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, amount, description: description || undefined }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error creando movimiento'));
  revalidatePath('/dashboard');
}

export async function createUserAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();

  const res = await fetch(`${backend()}/users`, {
    method: 'POST',
    headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, role: role || undefined }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error creando usuario'));
  revalidatePath('/dashboard');
}

export async function updateUserAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? '').trim();

  if (!id) throw new Error('ID requerido');

  const body: Record<string, unknown> = {};
  if (email) body.email = email;
  if (name) body.name = name;
  if (role) body.role = role;

  const res = await fetch(`${backend()}/users/${id}`, {
    method: 'PATCH',
    headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error actualizando usuario'));
  revalidatePath('/dashboard');
}

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!id) throw new Error('ID requerido');

  const res = await fetch(`${backend()}/users/${id}`, {
    method: 'DELETE',
    headers: await authHeader(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Error borrando usuario'));
  revalidatePath('/dashboard');
}

