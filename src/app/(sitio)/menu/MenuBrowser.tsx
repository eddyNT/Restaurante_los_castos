"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MenuProduct } from "@/lib/menu";
import { ProductCard } from "@/components/ProductCard";

type Category = { id: string; name: string; slug: string; products: MenuProduct[] };

const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function MenuBrowser({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(categories[0]?.slug);
  const chipsRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return categories;
    return categories
      .map((c) => ({ ...c, products: c.products.filter((p) => normalize(`${p.name} ${p.description ?? ""}`).includes(q)) }))
      .filter((c) => c.products.length > 0);
  }, [categories, query]);

  // Resalta la categoría visible mientras se recorre el menú
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-160px 0px -55% 0px" },
    );
    filtered.forEach((c) => {
      const el = document.getElementById(c.slug);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [filtered]);

  useEffect(() => {
    chipsRef.current?.querySelector(`[data-slug="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <div>
      <div className="sticky top-[78px] z-20 -mx-4 space-y-3 bg-canvas/95 px-4 pb-3 pt-4 backdrop-blur md:top-[70px]">
        <div className="relative max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca un plato: silpancho, sopa, jugo…"
            className="input rounded-full py-3 pl-11"
            aria-label="Buscar en el menú"
          />
        </div>
        <div ref={chipsRef} className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          {filtered.map((c) => (
            <a
              key={c.id}
              href={`#${c.slug}`}
              data-slug={c.slug}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                active === c.slug ? "bg-brand text-white shadow-md shadow-brand/30" : "bg-white text-ink ring-1 ring-line hover:ring-orange"
              }`}
            >
              {c.name}
              <span className={`ml-1.5 text-xs ${active === c.slug ? "text-accent" : "text-muted"}`}>{c.products.length}</span>
            </a>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-3xl">No encontramos «{query}»</p>
          <button className="btn-primary mt-4" onClick={() => setQuery("")}>Ver todo el menú</button>
        </div>
      ) : (
        <div className="mt-6 space-y-12">
          {filtered.map((c) => (
            <section key={c.id} id={c.slug} className="scroll-mt-48">
              <div className="mb-5 flex items-center gap-4">
                <h2 className="text-4xl text-brand">{c.name}</h2>
                <div className="stripe h-1.5 flex-1 rounded-full opacity-70" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {c.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
