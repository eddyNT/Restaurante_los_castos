"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  notes?: string;
};

type CartState = {
  items: CartItem[];
  tableToken: string | null;
  tableNumber: string | null;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setNotes: (productId: string, notes: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setTable: (token: string | null, number: string | null) => void;
};

// El carrito vive en el navegador; el servidor recalcula los precios al confirmar el pedido.
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      tableToken: null,
      tableNumber: null,
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: Math.min(i.quantity + quantity, 99) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity }] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(quantity, 99) } : i)),
        })),
      setNotes: (productId, notes) =>
        set((s) => ({ items: s.items.map((i) => (i.productId === productId ? { ...i, notes } : i)) })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      setTable: (tableToken, tableNumber) => set({ tableToken, tableNumber }),
    }),
    { name: "carrito" },
  ),
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
export const cartTotal = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity * i.price, 0);
