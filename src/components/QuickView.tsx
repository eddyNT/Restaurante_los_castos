"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bs } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useUi } from "@/store/ui";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";
import { IngredientPicker } from "./IngredientPicker";

/** Ventana con el detalle del plato: ingredientes, cantidad, nota para cocina y botón de agregar. */
export function QuickView() {
  const { quickView: p, showProduct, notifyAdded } = useUi();
  const add = useCart((s) => s.add);
  const setNotes = useCart((s) => s.setNotes);
  const [qty, setQty] = useState(1);
  const [notes, setNoteText] = useState("");
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    setQty(1);
    setNoteText("");
    setRemoved([]);
    if (!p) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && showProduct(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [p, showProduct]);

  if (!p) return null;

  function addToCart() {
    if (!p) return;
    const key = add({ productId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, removed }, qty);
    if (notes.trim()) setNotes(key, notes.trim());
    notifyAdded(`${qty} × ${p.name}`, p.imageUrl);
    showProduct(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={p.name}>
      <button className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => showProduct(null)} aria-label="Cerrar" />
      <div className="relative max-h-[92vh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="relative">
          <ProductImage src={p.imageUrl} name={p.name} className="aspect-[4/3] w-full" />
          <button
            onClick={() => showProduct(null)}
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-xl font-bold shadow"
            aria-label="Cerrar"
          >
            ×
          </button>
          <div className="stripe absolute bottom-0 h-1.5 w-full" />
        </div>
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-3xl leading-tight">{p.name}</h2>
            <span className="shrink-0 rounded-full bg-accent px-3 py-1 font-display text-xl">{bs(p.price)}</span>
          </div>
          {p.description && <p className="text-muted">{p.description}</p>}
          {p.isAvailable ? (
            <>
              <IngredientPicker ingredients={p.ingredients} removed={removed} onChange={setRemoved} />
              <div>
                <label className="label" htmlFor="qv-notes">¿Algún detalle para cocina?</label>
                <input
                  id="qv-notes"
                  className="input"
                  placeholder="Ej.: bien cocido, poca sal…"
                  maxLength={120}
                  value={notes}
                  onChange={(e) => setNoteText(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, Math.min(99, n)))} label="Cantidad" />
                <button onClick={addToCart} className="btn-primary flex-1 py-3 text-base">
                  Agregar · {bs(p.price * qty)}
                </button>
              </div>
            </>
          ) : (
            <p className="rounded-xl bg-accent-soft px-4 py-3 font-bold">Este plato se agotó por hoy.</p>
          )}
          <Link href={`/producto/${p.slug}`} onClick={() => showProduct(null)} className="block text-center text-sm font-bold text-orange">
            Ver página del plato
          </Link>
        </div>
      </div>
    </div>
  );
}
