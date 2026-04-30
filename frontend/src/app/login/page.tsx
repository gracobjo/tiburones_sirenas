import { loginAction } from './actions';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-2xl font-semibold">Acceso a la peña</h1>
      <p className="mt-2 text-sm text-slate-300">
        Solo emails autorizados. Introduce tu email para obtener un JWT.
      </p>

      <form action={loginAction} className="mt-6 space-y-3">
        <label className="block">
          <span className="text-sm text-slate-200">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
            placeholder="persona01@pena.local"
          />
        </label>

        <button className="w-full rounded-xl bg-slate-100 px-3 py-2 font-medium text-slate-950 hover:bg-white">
          Entrar
        </button>
      </form>
    </div>
  );
}

