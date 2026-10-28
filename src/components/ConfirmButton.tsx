"use client";
import { useState } from "react";

/** Botón destructivo con confirmación dentro de la página (sin window.confirm). */
export function ConfirmButton({
  action,
  id,
  label,
  question,
}: {
  action: (form: FormData) => Promise<void>;
  id: string;
  label: string;
  question: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" className="btn-danger px-3 py-1.5 text-xs" onClick={() => setAsking(true)}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="flex items-center gap-1 text-xs">
      <input type="hidden" name="id" value={id} />
      <span>{question}</span>
      <button className="btn-danger px-2 py-1 text-xs">Sí</button>
      <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setAsking(false)}>No</button>
    </form>
  );
}
