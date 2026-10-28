"use client";

export function QuantityStepper({
  value,
  onChange,
  size = "md",
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  size?: "sm" | "md";
  label: string;
}) {
  const btn = size === "sm" ? "h-8 w-8 text-lg" : "h-10 w-10 text-xl";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-accent-soft p-1" role="group" aria-label={label}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(value - 1); }}
        className={`${btn} grid place-items-center rounded-full bg-white font-extrabold text-brand shadow-sm transition hover:bg-brand hover:text-white active:scale-90`}
        aria-label="Quitar uno"
      >
        −
      </button>
      <span key={value} className="min-w-7 animate-pop text-center font-extrabold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onChange(value + 1); }}
        className={`${btn} grid place-items-center rounded-full bg-brand font-extrabold text-white shadow-sm transition hover:bg-brand-dark active:scale-90`}
        aria-label="Agregar uno"
      >
        +
      </button>
    </div>
  );
}
