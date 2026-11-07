"use client";
import { useActionState } from "react";
import { saveBranch, saveSettings } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/SubmitButton";
import { DAY_NAMES } from "@/lib/format";
import type { FormState } from "@/app/actions/auth";
import type { Settings } from "@/lib/settings";

function Message({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  if (state?.ok) return <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{state.ok}</p>;
  return null;
}

const FIELDS: { key: keyof Settings; label: string; placeholder?: string }[] = [
  { key: "restaurantName", label: "Nombre del restaurante" },
  { key: "tagline", label: "Frase de bienvenida" },
  { key: "deliveryFee", label: "Costo de delivery (Bs)" },
  { key: "prepMinutes", label: "Tiempo mínimo de preparación (minutos)", placeholder: "20" },
  { key: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "instagramUrl", label: "Instagram", placeholder: "https://instagram.com/…" },
  { key: "androidAppUrl", label: "Enlace Google Play (cuando exista la app nativa)", placeholder: "https://play.google.com/…" },
  { key: "iosAppUrl", label: "Enlace App Store (cuando exista la app nativa)", placeholder: "https://apps.apple.com/…" },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      <h2 className="text-lg font-extrabold sm:col-span-2">Datos generales</h2>
      {FIELDS.map((f) => (
        <div key={f.key} className={f.key === "tagline" ? "sm:col-span-2" : ""}>
          <label className="label" htmlFor={f.key}>{f.label}</label>
          <input id={f.key} name={f.key} className="input" defaultValue={settings[f.key]} placeholder={f.placeholder} />
        </div>
      ))}
      <div className="space-y-2 sm:col-span-2">
        <Message state={state} />
        <SubmitButton>Guardar</SubmitButton>
      </div>
    </form>
  );
}

type Branch = {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  mapUrl: string;
  hours: { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean }[];
};

export function BranchForm({ branch }: { branch: Branch }) {
  const [state, action] = useActionState(saveBranch, undefined);
  const hour = (d: number) => branch.hours.find((h) => h.dayOfWeek === d);
  return (
    <form action={action} className="card grid gap-4 p-6 sm:grid-cols-2">
      <input type="hidden" name="id" value={branch.id} />
      <h2 className="text-lg font-extrabold sm:col-span-2">Sucursal: {branch.name}</h2>
      <div><label className="label" htmlFor={`bn-${branch.id}`}>Nombre</label><input id={`bn-${branch.id}`} name="name" className="input" defaultValue={branch.name} required /></div>
      <div><label className="label" htmlFor={`ba-${branch.id}`}>Dirección</label><input id={`ba-${branch.id}`} name="address" className="input" defaultValue={branch.address} required /></div>
      <div><label className="label" htmlFor={`bp-${branch.id}`}>Teléfono</label><input id={`bp-${branch.id}`} name="phone" className="input" defaultValue={branch.phone} /></div>
      <div><label className="label" htmlFor={`bw-${branch.id}`}>WhatsApp</label><input id={`bw-${branch.id}`} name="whatsapp" className="input" defaultValue={branch.whatsapp} /></div>
      <div><label className="label" htmlFor={`be-${branch.id}`}>Correo</label><input id={`be-${branch.id}`} name="email" type="email" className="input" defaultValue={branch.email} /></div>
      <div><label className="label" htmlFor={`bm-${branch.id}`}>Enlace de Google Maps</label><input id={`bm-${branch.id}`} name="mapUrl" className="input" defaultValue={branch.mapUrl} /></div>
      <fieldset className="sm:col-span-2">
        <legend className="label">Horario de atención</legend>
        <div className="divide-y divide-line rounded-lg border border-line">
          {DAY_NAMES.map((name, d) => (
            <div key={d} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-2 px-3 py-2 text-sm">
              <span>{name}</span>
              <input type="time" name={`open-${d}`} defaultValue={hour(d)?.opensAt ?? "08:00"} className="input py-1" aria-label={`${name} abre`} />
              <input type="time" name={`close-${d}`} defaultValue={hour(d)?.closesAt ?? "22:00"} className="input py-1" aria-label={`${name} cierra`} />
              <label className="flex items-center gap-1"><input type="checkbox" name={`closed-${d}`} defaultChecked={hour(d)?.isClosed} /> Cerrado</label>
            </div>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2 sm:col-span-2">
        <Message state={state} />
        <SubmitButton>Guardar sucursal</SubmitButton>
      </div>
    </form>
  );
}
