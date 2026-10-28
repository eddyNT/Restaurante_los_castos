"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";

export function TableBanner() {
  const { tableNumber, setTable } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !tableNumber) return null;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent-soft px-4 py-3 text-sm">
      <span>
        Estás pidiendo para la <b>mesa {tableNumber}</b>.
      </span>
      <button className="font-semibold underline" onClick={() => setTable(null, null)}>
        No estoy en una mesa
      </button>
    </div>
  );
}
