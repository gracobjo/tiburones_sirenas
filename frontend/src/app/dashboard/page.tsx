import { cookies } from 'next/headers';
import { apiFetch, backendPublicUrl } from '@/lib/api';
import { createBetAction, createTransactionAction, updateBetStatusAction } from './actions';
import { logoutAction } from '../login/actions';

type Summary = {
  balanceCents: number;
  latestBets: Array<{
    id: string;
    date: string;
    amount: number;
    fileUrl: string | null;
    betCode: string;
    status: 'pending' | 'won' | 'lost';
    prizeAmount: number | null;
    validatedAt: string | null;
  }>;
  weekly: { betsCount: number; since: string };
  users: Array<{ id: string; email: string; name: string; role: 'admin' | 'user' }>;
};

function eur(cents: number) {
  return `${(cents / 100).toFixed(2)}€`;
}

export default async function DashboardPage() {
  const role = cookies().get('user_role')?.value ?? 'user';
  const email = cookies().get('user_email')?.value ?? '';

  const summary = await apiFetch<Summary>('/dashboard/summary');

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

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold">Últimas apuestas</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-300">
              <tr>
                <th className="py-2">Código</th>
                <th className="py-2">Fecha</th>
                <th className="py-2">Importe</th>
                <th className="py-2">Estado</th>
                <th className="py-2">Archivo</th>
                {role === 'admin' ? <th className="py-2">Actualizar</th> : null}
              </tr>
            </thead>
            <tbody>
              {summary.latestBets.map((b) => (
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
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-lg font-semibold">Usuarios</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {summary.users.map((u) => (
            <div key={u.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3">
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-slate-300">{u.email}</div>
              <div className="mt-1 text-xs text-slate-400">rol: {u.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

