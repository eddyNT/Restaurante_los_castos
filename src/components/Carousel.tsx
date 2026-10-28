"use client";
import { useRef } from "react";
import type { MenuProduct } from "@/lib/menu";
import { ProductCard } from "./ProductCard";

export function Carousel({ products }: { products: MenuProduct[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-4 [scrollbar-width:none]">
        {products.map((p) => (
          <div key={p.id} className="w-[78%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]">
            <ProductCard product={p} large />
          </div>
        ))}
      </div>
      {products.length > 3 && (
        <div className="mt-2 flex justify-end gap-2">
          <button onClick={() => scroll(-1)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-xl font-bold shadow ring-1 ring-line hover:bg-accent" aria-label="Anterior">←</button>
          <button onClick={() => scroll(1)} className="grid h-11 w-11 place-items-center rounded-full bg-brand text-xl font-bold text-white shadow hover:bg-brand-dark" aria-label="Siguiente">→</button>
        </div>
      )}
    </div>
  );
}
