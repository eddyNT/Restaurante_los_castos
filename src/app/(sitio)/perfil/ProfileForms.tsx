"use client";
import { useActionState } from "react";
import { addAddress, changePassword, updateProfile } from "@/app/actions/customer";
import { SubmitButton } from "@/components/SubmitButton";
import type { FormState } from "@/app/actions/auth";

function Message({ state }: { state: FormState }) {
  if (state?.error) return <p className="text-sm text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="text-sm text-brand">{state.ok}</p>;
  return null;
}

export function ProfileForms({ fullName, phone }: { fullName: string; phone: string }) {
  const [profile, profileAction] = useActionState(updateProfile, undefined);
  const [pass, passAction] = useActionState(changePassword, undefined);
  const [addr, addrAction] = useActionState(addAddress, undefined);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={profileAction} className="card space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Datos personales</h2>
        <div>
          <label className="label" htmlFor="fullName">Nombre completo</label>
          <input id="fullName" name="fullName" className="input" defaultValue={fullName} required />
        </div>
        <div>
          <label className="label" htmlFor="phone">Celular</label>
          <input id="phone" name="phone" className="input" defaultValue={phone} required />
        </div>
        <Message state={profile} />
        <SubmitButton>Guardar</SubmitButton>
      </form>

      <form action={passAction} className="card space-y-3 p-5">
        <h2 className="text-lg font-extrabold">Contraseña</h2>
        <div>
          <label className="label" htmlFor="current">Contraseña actual</label>
          <input id="current" name="current" type="password" className="input" required autoComplete="current-password" />
        </div>
        <div>
          <label className="label" htmlFor="next">Nueva contraseña</label>
          <input id="next" name="next" type="password" className="input" required minLength={8} autoComplete="new-password" />
        </div>
        <Message state={pass} />
        <SubmitButton>Cambiar contraseña</SubmitButton>
      </form>

      <form action={addrAction} className="card space-y-3 p-5 md:col-span-2">
        <h2 className="text-lg font-extrabold">Agregar dirección</h2>
        <div className="grid gap-3 sm:grid-cols-[140px_1fr_1fr]">
          <input name="label" className="input" placeholder="Casa" required aria-label="Nombre" />
          <input name="line" className="input" placeholder="Calle, número, zona" required aria-label="Dirección" />
          <input name="reference" className="input" placeholder="Referencia (opcional)" aria-label="Referencia" />
        </div>
        <Message state={addr} />
        <SubmitButton>Agregar</SubmitButton>
      </form>
    </div>
  );
}
