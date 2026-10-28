"use client";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/store/cart";
import { useUi } from "@/store/ui";

export function CartLink() {
  const items = useCart((s) => s.items);
  const { openCart, cartPulse } = useUi();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;
  return (
    <button
      type="button"
      onClick={openCart}
      className="btn-accent relative px-4"
      aria-label={`Abrir carrito, ${count} productos`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.5" />
        <circle cx="17" cy="20" r="1.5" />
      </svg>
      <span key={cartPulse} className="animate-pop tabular-nums">{count}</span>
    </button>
  );
}
