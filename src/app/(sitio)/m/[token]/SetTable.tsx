"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";

export function SetTable({ token, number }: { token: string; number: string }) {
  const setTable = useCart((s) => s.setTable);
  const router = useRouter();
  useEffect(() => {
    setTable(token, number);
    router.replace("/menu");
  }, [token, number, setTable, router]);
  return <p className="py-16 text-center text-muted">Abriendo el menú de la mesa {number}…</p>;
}
