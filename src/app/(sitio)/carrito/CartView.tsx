"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartTotal, useCart } from "@/store/cart";
import { bs } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";

export function CartView() {
  const { items, setQuantity, setNotes, remove, clear, tableNumber } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="text-lg font-semibold">Tu carrito está vacío</p>
        <p className="mt-1 text-muted">Agrega platos desde el menú.</p>
        <Link href="/menu" className="btn-primary mt-4">Ir al menú</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="card divide-y divide-line">
        {items.map((i) => (
          <li key={i.productId} className="flex gap-4 p-4">
            <ProductImage src={i.imageUrl} name={i.name} className="h-16 w-16 shrink-0 rounded-lg text-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2">
                <p className="font-semibold">{i.name}</p>
                <p className="font-semibold tabular-nums">{bs(i.price * i.quantity)}</p>
              </div>
              <p className="text-sm text-muted tabular-nums">{bs(i.price)} c/u</p>
              <input
                className="input mt-2 py-1.5"
                placeholder="Nota para cocina, por ejemplo: sin cebolla"
                value={i.notes ?? ""}
                maxLength={120}
                onChange={(e) => setNotes(i.productId, e.target.value)}
                aria-label={`Nota para ${i.name}`}
              />
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-line">
                  <button className="px-3 py-1" onClick={() => setQuantity(i.productId, i.quantity - 1)} aria-label="Quitar uno">−</button>
                  <span className="w-8 text-center tabular-nums">{i.quantity}</span>
                  <button className="px-3 py-1" onClick={() => setQuantity(i.productId, i.quantity + 1)} aria-label="Agregar uno">+</button>
                </div>
                <button className="text-sm text-red-700 hover:underline" onClick={() => remove(i.productId)}>
                  Eliminar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <div>
          <p className="text-sm text-muted">Subtotal{tableNumber ? ` · Mesa ${tableNumber}` : ""}</p>
          <p className="text-2xl font-bold tabular-nums">{bs(cartTotal(items))}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={clear}>Vaciar</button>
          <Link href="/checkout" className="btn-primary">Confirmar pedido</Link>
        </div>
      </div>
    </div>
  );
}
