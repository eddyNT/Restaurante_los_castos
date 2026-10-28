"use client";
import { useActionState, useState } from "react";
import { createWorker, resetPassword } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/SubmitButton";

export function WorkerForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createWorker, undefined);
  return (
    <form action={action} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-2">
      <h2 className="text-lg font-extrabold sm:col-span-2">Crear cuenta de trabajador</h2>
      <div>
        <label className="label" htmlFor="w-name">Nombre completo</label>
        <input id="w-name" name="fullName" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="w-email">Correo (usuario)</label>
        <input id="w-email" name="email" type="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="w-phone">Celular</label>
        <input id="w-phone" name="phone" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="w-pass">Contraseña inicial</label>
        <input id="w-pass" name="password" type="text" minLength={8} className="input" required autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="w-role">Rol</label>
        <select id="w-role" name="role" className="input" defaultValue="ADMIN">
          <option value="ADMIN">Admin / Trabajador</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>
      <fieldset>
        <legend className="label">Sucursales</legend>
        {branches.map((b) => (
          <label key={b.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="branchIds" value={b.id} defaultChecked={branches.length === 1} /> {b.name}
          </label>
        ))}
      </fieldset>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand sm:col-span-2">{state.ok}</p>}
      <div className="sm:col-span-2">
        <SubmitButton>Crear cuenta</SubmitButton>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(resetPassword, undefined);
  if (!open) {
    return <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setOpen(true)}>Cambiar contraseña</button>;
  }
  return (
    <form action={action} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input name="password" minLength={8} required placeholder="Nueva contraseña" className="input w-40 py-1.5 text-xs" aria-label="Nueva contraseña" />
      <SubmitButton className="btn-primary px-3 py-1.5 text-xs" pendingText="…">OK</SubmitButton>
      {state?.error && <span className="text-xs text-red-700">{state.error}</span>}
      {state?.ok && <span className="text-xs text-brand">{state.ok}</span>}
    </form>
  );
}
