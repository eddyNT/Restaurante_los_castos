"use client";
import type { Ingredient } from "@/lib/menu";

/** Lista de lo que trae el plato: el cliente desmarca lo que no quiere. Los ingredientes fijos no se pueden quitar. */
export function IngredientPicker({
  ingredients,
  removed,
  onChange,
}: {
  ingredients: Ingredient[];
  removed: string[];
  onChange: (removed: string[]) => void;
}) {
  if (ingredients.length === 0) return null;
  const toggle = (name: string) =>
    onChange(removed.includes(name) ? removed.filter((r) => r !== name) : [...removed, name]);

  return (
    <fieldset>
      <legend className="label">Trae · desmarca lo que no quieras</legend>
      <div className="flex flex-wrap gap-2">
        {ingredients.map((i) => {
          const included = !removed.includes(i.name);
          return (
            <label
              key={i.name}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                !i.removable
                  ? "border-line bg-canvas text-muted"
                  : included
                    ? "cursor-pointer border-brand bg-brand-soft text-brand"
                    : "cursor-pointer border-line text-muted line-through"
              }`}
            >
              <input
                type="checkbox"
                className="accent-brand"
                checked={included}
                disabled={!i.removable}
                onChange={() => toggle(i.name)}
              />
              {i.name}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
