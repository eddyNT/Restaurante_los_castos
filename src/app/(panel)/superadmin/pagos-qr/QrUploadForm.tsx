"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useState } from "react";
import { uploadPaymentQr } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/SubmitButton";

export function QrUploadForm({ branches }: { branches: { id: string; name: string }[] }) {
  const [state, action] = useActionState(uploadPaymentQr, undefined);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={action} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-[1fr_180px]">
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold">Cargar un QR nuevo</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bankName">Banco</label>
            <input id="bankName" name="bankName" className="input" placeholder="Ej.: Banco Unión" required />
          </div>
          <div>
            <label className="label" htmlFor="accountHolder">Titular de la cuenta</label>
            <input id="accountHolder" name="accountHolder" className="input" required />
          </div>
        </div>
        {branches.length > 1 ? (
          <div>
            <label className="label" htmlFor="branchId">Sucursal</label>
            <select id="branchId" name="branchId" className="input">
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        ) : (
          <input type="hidden" name="branchId" value={branches[0]?.id} />
        )}
        <div>
          <label className="label" htmlFor="image">Imagen del QR (PNG o JPG)</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="activate" defaultChecked /> Usar este QR desde ahora
        </label>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{state.ok}</p>}
        <SubmitButton pendingText="Subiendo…">Cargar QR</SubmitButton>
      </div>
      <div className="flex items-center justify-center rounded-lg border border-dashed border-line bg-canvas p-2">
        {preview ? (
          <img src={preview} alt="Vista previa del QR" className="max-h-44 rounded" />
        ) : (
          <p className="text-center text-xs text-muted">Vista previa del QR</p>
        )}
      </div>
    </form>
  );
}
