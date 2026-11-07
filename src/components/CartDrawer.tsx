"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { bs } from "@/lib/format";
import { cartCount, cartTotal, removedLabel, useCart } from "@/store/cart";
import { useUi } from "@/store/ui";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";

/** Carrito lateral, barra flotante con el total y avisos de «agregado». */
export function CartDrawer() {
  const { items, setQuantity, remove } = useCart();
  const { cartOpen, closeCart, openCart, toasts } = useUi();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => closeCart(), [pathname, closeCart]);
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cartOpen, closeCart]);

  if (!mounted) return null;
  const count = cartCount(items);
  const total = cartTotal(items);
  const hideBar = ["/carrito", "/checkout"].includes(pathname) || cartOpen || count === 0;

  return (
    <>
      {/* Avisos */}
      <div className="pointer-events-none fixed right-4 top-20 z-[60] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="flex animate-fade-up items-center gap-3 rounded-2xl bg-ink px-3 py-2 pr-4 text-sm text-white shadow-xl">
            <ProductImage src={t.imageUrl} name={t.text} className="h-10 w-10 rounded-xl text-xs" />
            <span><b className="text-accent">✓ Agregado:</b> {t.text}</span>
          </div>
        ))}
      </div>

      {/* Barra flotante */}
      {!hideBar && (
        <button
          onClick={openCart}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md animate-fade-up items-center justify-between gap-3 rounded-full bg-brand px-5 py-3.5 text-white shadow-2xl shadow-brand/40 transition hover:bg-brand-dark"
          style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <span className="grid h-8 min-w-8 place-items-center rounded-full bg-accent px-2 font-extrabold text-ink">{count}</span>
          <span className="font-extrabold">Ver mi pedido</span>
          <span className="font-display text-lg tabular-nums">{bs(total)}</span>
        </button>
      )}

      {/* Panel lateral */}
      {cartOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Tu pedido">
          <button className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={closeCart} aria-label="Cerrar carrito" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in flex-col bg-canvas shadow-2xl">
            <header className="flex items-center justify-between bg-brand px-5 py-4 text-white">
              <h2 className="text-2xl">Tu pedido</h2>
              <button onClick={closeCart} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl" aria-label="Cerrar">×</button>
            </header>
            <div className="stripe h-1.5" />
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <p className="font-display text-2xl">Tu carrito está vacío</p>
                <p className="text-muted">Elige algo rico del menú.</p>
                <Link href="/menu" className="btn-primary">Ver el menú</Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto p-4">
                  {items.map((i) => (
                    <li key={i.key} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line">
                      <ProductImage src={i.imageUrl} name={i.name} className="h-20 w-20 shrink-0 rounded-xl text-lg" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <p className="font-extrabold leading-tight">{i.name}</p>
                          <button onClick={() => remove(i.key)} className="text-xs font-bold text-muted hover:text-brand" aria-label={`Quitar ${i.name}`}>
                            Quitar
                          </button>
                        </div>
                        {i.removed.length > 0 && <p className="text-xs font-bold text-brand">{removedLabel(i.removed)}</p>}
                        {i.notes && <p className="truncate text-xs text-orange">{i.notes}</p>}
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <QuantityStepper size="sm" value={i.quantity} onChange={(n) => setQuantity(i.key, n)} label={`Cantidad de ${i.name}`} />
                          <span className="font-display text-lg tabular-nums">{bs(i.price * i.quantity)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <footer className="space-y-3 border-t border-line bg-white p-5">
                  <div className="flex items-end justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-display text-3xl text-brand tabular-nums">{bs(total)}</span>
                  </div>
                  <Link href="/checkout" className="btn-primary w-full py-3.5 text-base">Confirmar pedido</Link>
                  <Link href="/carrito" className="block text-center text-sm font-bold text-muted hover:text-orange">
                    Ver carrito completo y agregar notas
                  </Link>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
