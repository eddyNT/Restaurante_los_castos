"use client";
import { create } from "zustand";
import type { MenuProduct } from "@/lib/menu";

type Toast = { id: number; text: string; imageUrl: string | null };

type UiState = {
  cartOpen: boolean;
  quickView: MenuProduct | null;
  toasts: Toast[];
  cartPulse: number;
  openCart: () => void;
  closeCart: () => void;
  showProduct: (p: MenuProduct | null) => void;
  notifyAdded: (name: string, imageUrl: string | null) => void;
};

let nextId = 1;

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  quickView: null,
  toasts: [],
  cartPulse: 0,
  openCart: () => set({ cartOpen: true, quickView: null }),
  closeCart: () => set({ cartOpen: false }),
  showProduct: (quickView) => set({ quickView }),
  notifyAdded: (name, imageUrl) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text: name, imageUrl }], cartPulse: s.cartPulse + 1 }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
}));
