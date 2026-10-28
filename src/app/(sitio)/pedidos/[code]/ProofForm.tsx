"use client";
import { useActionState } from "react";
import { uploadProof } from "@/app/actions/customer";
import { SubmitButton } from "@/components/SubmitButton";

export function ProofForm({ code }: { code: string }) {
  const [state, action] = useActionState(uploadProof, undefined);
  return (
    <form action={action} className="mt-4 space-y-2">
      <input type="hidden" name="code" value={code} />
      <label className="label" htmlFor="proof">Captura del comprobante</label>
      <input id="proof" name="proof" type="file" accept="image/png,image/jpeg,image/webp" required className="input" />
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p className="text-sm text-brand">{state.ok}</p>}
      <SubmitButton pendingText="Subiendo…">Enviar comprobante</SubmitButton>
    </form>
  );
}
