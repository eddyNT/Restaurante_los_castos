"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  /** Identifica la línea: el mismo plato con distintos ingredientes quitados son líneas separadas. */
  key: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  /** Ingredientes que el cliente no quiere (ej.: ["Arroz", "Ensalada"]). */
  removed: string[];
  notes?: string;
};

type NewItem = Omit<CartItem, "key" | "quantity" | "removed"> & { removed?: string[] };

type CartState = {
  items: CartItem[];
  add: (item: NewItem, quantity?: number) => string;
  setQuantity: (key: string, quantity: number) => void;
  setNotes: (key: string, notes: string) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const lineKey = (productId: string, removed: string[] = []) => `${productId}|${[...removed].sort().join(",")}`;

// El carrito vive en el navegador; el servidor recalcula los precios al confirmar el pedido.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) => {
        const removed = [...(item.removed ?? [])].sort();
        const key = lineKey(item.productId, removed);
        set((s) => {
          const existing = s.items.find((i) => i.key === key);
          if (existing) {
            return { items: s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 99) } : i)) };
          }
          return { items: [...s.items, { ...item, key, removed, quantity }] };
        });
        return key;
      },
      setQuantity: (key, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.key !== key)
              : s.items.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, 99) } : i)),
        })),
      setNotes: (key, notes) => set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, notes } : i)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "carrito",
      version: 2,
      // Carritos guardados antes de los ingredientes: cada línea pasa a ser el plato completo
      migrate: (state) => {
        const s = state as { items?: Omit<CartItem, "key" | "removed">[] } | undefined;
        return { items: (s?.items ?? []).map((i) => ({ ...i, removed: [], key: lineKey(i.productId) })) } as unknown as CartState;
      },
    },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity * i.price, 0);

/** Texto para el cliente y para cocina: «Sin arroz, ensalada». */
export const removedLabel = (removed: string[]) => (removed.length ? "Sin " + removed.join(", ").toLowerCase() : "");
