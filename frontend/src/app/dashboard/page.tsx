import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiFetch, backendPublicUrl } from '@/lib/api';
import {
  createBetAction,
  createTransactionAction,
  createUserAction,
  deleteBetAction,
  deleteUserAction,
  updateBetAction,
  updateBetStatusAction,
  updateUserAction,
} from './actions';
import { logoutAction } from '../login/actions';

type Summary = {
  balanceCents: number;
  latestBets: Bet[];
  weekly: { betsCount: number; since: string };
  users: Array<{ id: string; email: string; name: string; role: 'admin' | 'user' }>;
};

type Bet = {
  id: string;
  date: string;
  amount: number;
  fileUrl: string | null;
  betCode: string;
  status: 'pending' | 'won' | 'lost';
  prizeAmount: number | null;
  validatedAt: string | null;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
};

function eur(cents: number) {
  return `${(cents / 100).toFixed(2)}€`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) redirect('/login');
  const role = cookieStore.get('user_role')?.value ?? 'user';
  const email = cookieStore.get('user_email')?.value ?? '';

  const sp = await searchParams;
  const tab = sp?.tab === 'users' ? 'users' : 'bets';

  const results = await Promise.allSettled([
    apiFetch<Summary>('/dashboard/summary'),
    tab === 'bets' ? apiFetch<Bet[]>('/bets') : Promise.resolve(null),
    tab === 'users' ? apiFetch<UserRow[]>('/users') : Promise.resolve(null),
  ]);

  const summaryResult = results[0];
  if (summaryResult.status === 'rejected') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-rose-900/40 bg-rose-950/20 p-6 text-slate-100">
        <div className="text-lg font-semibold">No se pudo cargar el dashboard</div>
        <div className="mt-2 text-sm text-slate-200">
          El backend no está disponible o está reiniciando. Recarga en unos segundos.
        </div>
        <div className="mt-4 flex gap-2">
          <a
            href="/dashboard"
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900"
          >
            Reintentar
          </a>
        </div>
      </div>
    );
  }

  const summary = summaryResult.value;
  const bets = results[1].status === 'fulfilled' ? results[1].value : null;
  const users = results[2].status === 'fulfilled' ? results[2].value : null;
  const tabLoadError =
    (tab === 'bets' && results[1].status === 'rejected') ||
    (tab === 'users' && results[2].status === 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Sesión: <span className="text-slate-200">{email}</span> · Rol:{' '}
            <span className="text-slate-200">{role}</span>
          </p>
        </div>
        <form action={logoutAction}>
          <button className="rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900">
            Salir
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-sm text-slate-300">Saldo total del grupo</div>
          <div className="mt-2 text-3xl font-semibold">{eur(summary.balanceCents)}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-sm text-slate-300">Apuestas últimos 7 días</div>
          <div className="mt-2 text-3xl font-semibold">{summary.weekly.betsCount}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="text-sm text-slate-300">Usuarios</div>
          <div className="mt-2 text-3xl font-semibold">{summary.users.length}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href="/dashboard?tab=bets"
          className={`rounded-xl border px-3 py-2 text-sm ${
            tab === 'bets'
              ? 'border-slate-500 bg-slate-900 text-slate-100'
              : 'border-slate-800 text-slate-300 hover:bg-slate-900/40'
          }`}
        >
          Apuestas
        </a>
        <a
          href="/dashboard?tab=users"
          className={`rounded-xl border px-3 py-2 text-sm ${
            tab === 'users'
              ? 'border-slate-500 bg-slate-900 text-slate-100'
              : 'border-slate-800 text-slate-300 hover:bg-slate-900/40'
          }`}
        >
          Usuarios
        </a>
        {role !== 'admin' ? (
          <span className="ml-1 text-xs text-slate-400">
            Solo admin puede crear/editar/borrar.
          </span>
        ) : null}
      </div>

      {tabLoadError ? (
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          No se pudo cargar la pestaña <span className="font-medium">{tab}</span>. Puede que el backend esté
          reiniciando. Recarga en unos segundos.
        </div>
      ) : null}

      {role === 'admin' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Nueva apuesta</h2>
            <form action={createBetAction} className="mt-4 grid gap-3">
              <input
                name="betCode"
                required
                placeholder="BET-0019"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              />
              <input
                name="amount"
                required
                inputMode="numeric"
                placeholder="Importe (céntimos) ej: 1000 = 10€"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              />
              <input
                name="file"
                type="file"
                accept="image/*,application/pdf"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              />
              <button className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-950 hover:bg-white">
                Crear apuesta
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-400">
              Nota: importes en backend se guardan en céntimos (Int).
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold">Movimiento de dinero</h2>
            <form action={createTransactionAction} className="mt-4 grid gap-3">
              <select
                name="type"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              >
                <option value="deposit">deposit</option>
                <option value="bet">bet</option>
                <option value="prize">prize</option>
                <option value="adjustment">adjustment</option>
              </select>
              <input
                name="amountEur"
                required
                inputMode="decimal"
                placeholder="Importe en € (ej: 25)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              />
              <input
                name="description"
                placeholder="Descripción (opcional)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
              />
              <button className="rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-950 hover:bg-white">
                Registrar movimiento
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
          Estás en modo lectura. Solo <span className="text-slate-100">admin</span> puede crear apuestas o movimientos.
        </div>
      )}

      {tab === 'bets' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold">Apuestas</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2">Código</th>
                  <th className="py-2">Fecha</th>
                  <th className="py-2">Importe</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2">Archivo</th>
                  {role === 'admin' ? <th className="py-2">Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {(bets ?? summary.latestBets).map((b) => (
                  <tr key={b.id} className="border-t border-slate-800">
                    <td className="py-2 font-medium">{b.betCode}</td>
                    <td className="py-2 text-slate-300">{new Date(b.date).toLocaleString()}</td>
                    <td className="py-2">{eur(b.amount)}</td>
                    <td className="py-2">
                      <span
                        className={
                          b.status === 'won'
                            ? 'text-emerald-300'
                            : b.status === 'lost'
                              ? 'text-rose-300'
                              : 'text-amber-300'
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {b.fileUrl ? (
                        <a
                          className="text-slate-200 underline decoration-slate-600 underline-offset-2 hover:decoration-slate-200"
                          href={`${backendPublicUrl()}${b.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          ver
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    {role === 'admin' ? (
                      <td className="py-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <details className="group">
                            <summary className="list-none">
                              <span className="cursor-pointer rounded-lg border border-slate-700 px-2 py-1 text-slate-200 hover:bg-slate-900">
                                Modificar
                              </span>
                            </summary>
                            <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                              <form action={updateBetAction} className="flex flex-wrap items-center gap-2">
                                <input type="hidden" name="id" value={b.id} />
                                <input
                                  name="betCode"
                                  defaultValue={b.betCode}
                                  className="w-40 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                                />
                                <input
                                  name="amountEur"
                                  inputMode="decimal"
                                  defaultValue={(b.amount / 100).toFixed(2)}
                                  className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                                />
                                <input
                                  name="date"
                                  type="datetime-local"
                                  defaultValue={new Date(b.date).toISOString().slice(0, 16)}
                                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                                />
                                <button className="rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-900">
                                  Guardar
                                </button>
                              </form>
                              <div className="mt-2 text-xs text-slate-500">
                                Importe en € (acepta coma o punto).
                              </div>
                            </div>
                          </details>
                          <form action={updateBetStatusAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="id" value={b.id} />
                            <select
                              name="status"
                              defaultValue={b.status}
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                            >
                              <option value="pending">pending</option>
                              <option value="won">won</option>
                              <option value="lost">lost</option>
                            </select>
                            <input
                              name="prizeAmountEur"
                              inputMode="decimal"
                              placeholder="premio €"
                              className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                            />
                            <button className="rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-900">
                              Guardar
                            </button>
                          </form>
                          <form action={deleteBetAction}>
                            <input type="hidden" name="id" value={b.id} />
                            <button className="rounded-lg border border-rose-900/60 px-2 py-1 text-rose-200 hover:bg-rose-950/30">
                              Borrar
                            </button>
                          </form>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'users' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Usuarios</h2>
            {role === 'admin' ? (
              <form action={createUserAction} className="flex flex-wrap items-center gap-2">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="email"
                  className="w-56 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                />
                <input
                  name="name"
                  required
                  placeholder="nombre"
                  className="w-48 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                />
                <select
                  name="role"
                  defaultValue="user"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <button className="rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-900">
                  Crear
                </button>
              </form>
            ) : null}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-300">
                <tr>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Rol</th>
                  <th className="py-2">Alta</th>
                  {role === 'admin' ? <th className="py-2">Acciones</th> : null}
                </tr>
              </thead>
              <tbody>
                {(users ?? summary.users).map((u: any) => (
                  <tr key={u.id} className="border-t border-slate-800">
                    {role === 'admin' ? (
                      <>
                        <td className="py-2" colSpan={4}>
                          <form action={updateUserAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="id" value={u.id} />
                            <input
                              name="name"
                              defaultValue={u.name}
                              className="w-48 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                            />
                            <input
                              name="email"
                              type="email"
                              defaultValue={u.email}
                              className="w-64 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                            />
                            <select
                              name="role"
                              defaultValue={u.role}
                              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                            <button className="rounded-lg border border-slate-700 px-2 py-1 hover:bg-slate-900">
                              Guardar
                            </button>
                            <span className="text-xs text-slate-500">
                              {'createdAt' in u ? new Date(u.createdAt as string).toLocaleDateString() : '—'}
                            </span>
                          </form>
                        </td>
                        <td className="py-2">
                          <form action={deleteUserAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="rounded-lg border border-rose-900/60 px-2 py-1 text-rose-200 hover:bg-rose-950/30">
                              Borrar
                            </button>
                          </form>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 font-medium">{u.name}</td>
                        <td className="py-2 text-slate-300">{u.email}</td>
                        <td className="py-2 text-slate-300">{u.role}</td>
                        <td className="py-2 text-slate-400">
                          {'createdAt' in u ? new Date(u.createdAt as string).toLocaleDateString() : '—'}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

