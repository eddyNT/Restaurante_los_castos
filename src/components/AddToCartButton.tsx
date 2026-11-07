"use client";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { useUi } from "@/store/ui";
import { bs } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu";
import { QuantityStepper } from "./QuantityStepper";
import { IngredientPicker } from "./IngredientPicker";

export function AddToCartButton({ product }: { product: MenuProduct }) {
  const add = useCart((s) => s.add);
  const notifyAdded = useUi((s) => s.notifyAdded);
  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState<string[]>([]);

  if (!product.isAvailable) {
    return <p className="rounded-xl bg-accent-soft px-4 py-3 font-bold">Este plato se agotó por hoy.</p>;
  }

  return (
    <div className="space-y-5">
      <IngredientPicker ingredients={product.ingredients} removed={removed} onChange={setRemoved} />
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper value={qty} onChange={(n) => setQty(Math.max(1, Math.min(99, n)))} label="Cantidad" />
        <button
          type="button"
          className="btn-primary px-6 py-3 text-base"
          onClick={() => {
            add({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, removed }, qty);
            notifyAdded(`${qty} × ${product.name}`, product.imageUrl);
            setQty(1);
            setRemoved([]);
          }}
        >
          Agregar · {bs(product.price * qty)}
        </button>
      </div>
    </div>
  );
}
