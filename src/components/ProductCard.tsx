"use client";
import { useEffect, useState } from "react";
import { bs } from "@/lib/format";
import type { MenuProduct } from "@/lib/menu";
import { lineKey, useCart } from "@/store/cart";
import { useUi } from "@/store/ui";
import { ProductImage } from "./ProductImage";
import { QuantityStepper } from "./QuantityStepper";

export function ProductCard({ product, large = false }: { product: MenuProduct; large?: boolean }) {
  const { items, add, setQuantity } = useCart();
  const { showProduct, notifyAdded } = useUi();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Si el plato tiene ingredientes que se pueden quitar, «Agregar» abre la ventana para elegirlos
  const customizable = product.ingredients.some((i) => i.removable);
  const plainKey = lineKey(product.id);
  const inCart = mounted ? items.filter((i) => i.productId === product.id).reduce((n, i) => n + i.quantity, 0) : 0;
  const plainInCart = mounted ? items.find((i) => i.key === plainKey)?.quantity ?? 0 : 0;

  function quickAdd(e: React.MouseEvent) {
    e.stopPropagation();
    if (customizable) return showProduct(product);
    add({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl });
    notifyAdded(product.name, product.imageUrl);
  }

  return (
    <article
      onClick={() => showProduct(product)}
      onKeyDown={(e) => e.key === "Enter" && showProduct(product)}
      tabIndex={0}
      role="button"
      aria-label={`Ver ${product.name}`}
      className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange/15 ${product.isAvailable ? "" : "opacity-60 grayscale"}`}
    >
      <div className={`relative overflow-hidden ${large ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
        <ProductImage src={product.imageUrl} name={product.name} className="h-full w-full transition duration-500 group-hover:scale-110" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-accent px-3 py-1 font-display text-lg text-ink shadow">
          {bs(product.price)}
        </span>
        {product.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-extrabold text-white shadow">
            ★ Favorito
          </span>
        )}
        {!product.isAvailable && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-extrabold text-white">Agotado hoy</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className={`${large ? "text-2xl" : "text-xl"} leading-tight text-ink`}>{product.name}</h3>
        {product.description && <p className="line-clamp-2 text-sm text-muted">{product.description}</p>}
        <div className="mt-auto flex items-center justify-end pt-3">
          {product.isAvailable &&
            (!customizable && plainInCart > 0 ? (
              <QuantityStepper
                size="sm"
                value={plainInCart}
                onChange={(n) => setQuantity(plainKey, n)}
                label={`Cantidad de ${product.name}`}
              />
            ) : (
              <button type="button" onClick={quickAdd} className="btn-primary px-4 py-2">
                <span className="text-lg leading-none">+</span> {customizable && inCart > 0 ? `Agregar otro (${inCart})` : "Agregar"}
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
