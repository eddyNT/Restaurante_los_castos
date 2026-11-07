"use client";
import { useState } from "react";
import type { Ingredient } from "@/lib/menu";

/** Lista editable de lo que trae el plato. Se envía al servidor como JSON en el campo «ingredients». */
export function IngredientsEditor({ initial }: { initial: Ingredient[] }) {
  const [rows, setRows] = useState<Ingredient[]>(initial);
  const [draft, setDraft] = useState("");

  const update = (idx: number, patch: Partial<Ingredient>) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  function addRow() {
    const name = draft.trim();
    if (!name || rows.some((r) => r.name.toLowerCase() === name.toLowerCase())) return;
    setRows((r) => [...r, { name, removable: true }]);
    setDraft("");
  }

  return (
    <fieldset className="space-y-2">
      <legend className="label">Ingredientes</legend>
      <p className="text-xs text-muted">
        Marca «Se puede quitar» en lo que el cliente puede pedir sin eso (ej.: arroz, ensalada). Lo principal del plato déjalo sin marcar.
      </p>
      <input type="hidden" name="ingredients" value={JSON.stringify(rows.filter((r) => r.name.trim()))} />
      {rows.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {rows.map((row, idx) => (
            <li key={idx} className="flex flex-wrap items-center gap-3 px-3 py-2">
              <input
                className="input flex-1 py-1.5"
                value={row.name}
                maxLength={40}
                onChange={(e) => update(idx, { name: e.target.value })}
                aria-label="Nombre del ingrediente"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={row.removable} onChange={(e) => update(idx, { removable: e.target.checked })} />
                Se puede quitar
              </label>
              <button
                type="button"
                className="text-sm text-red-700 hover:underline"
                onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="Nuevo ingrediente, ej.: Papas fritas"
          value={draft}
          maxLength={40}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRow();
            }
          }}
        />
        <button type="button" className="btn-ghost" onClick={addRow}>Agregar</button>
      </div>
    </fieldset>
  );
}
