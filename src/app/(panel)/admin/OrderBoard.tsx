"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import { setOrderStatus, verifyPayment } from "@/app/actions/staff";
import { bs, ORDER_TYPE_LABEL } from "@/lib/format";
import { PaymentBadge } from "@/components/StatusBadge";

type BoardOrder = {
  id: string;
  code: string;
  type: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  hasProof: boolean;
  total: number;
  customerName: string;
  table: string | null;
  createdAt: string;
  items: { name: string; quantity: number; notes: string | null }[];
};

const COLUMNS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "Nuevos", statuses: ["PENDING"] },
  { title: "En cocina", statuses: ["CONFIRMED", "PREPARING"] },
  { title: "Listos / en camino", statuses: ["READY", "OUT_FOR_DELIVERY"] },
  { title: "Cerrados hoy", statuses: ["DELIVERED", "CANCELLED"] },
];

function nextStep(o: BoardOrder): { status: OrderStatus; label: string } | null {
  switch (o.status) {
    case "PENDING": return { status: "CONFIRMED", label: "Aceptar" };
    case "CONFIRMED": return { status: "PREPARING", label: "A cocina" };
    case "PREPARING": return { status: "READY", label: "Marcar listo" };
    case "READY": return o.type === "DELIVERY" ? { status: "OUT_FOR_DELIVERY", label: "Salió a entregar" } : { status: "DELIVERED", label: "Entregado" };
    case "OUT_FOR_DELIVERY": return { status: "DELIVERED", label: "Entregado" };
    default: return null;
  }
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {}
}

export function OrderBoard() {
  const [orders, setOrders] = useState<BoardOrder[] | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const known = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data: BoardOrder[] = await res.json();
      if (known.current && data.some((o) => !known.current!.has(o.id))) beep();
      known.current = new Set(data.map((o) => o.id));
      setOrders(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const act = (fn: () => Promise<void>) => startTransition(async () => { await fn(); await load(); });

  if (!orders) return <p className="text-muted">Cargando pedidos…</p>;

  return (
    <>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Sin conexión con el servidor. Reintentando…</p>}
      <div className={`grid gap-4 lg:grid-cols-4 ${pending ? "opacity-70" : ""}`}>
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <section key={col.title} className="min-w-0 rounded-xl bg-white/60 p-2 ring-1 ring-line">
              <h2 className="flex items-center justify-between px-2 py-1 font-display font-semibold">
                {col.title}
                <span className="badge bg-canvas text-muted">{list.length}</span>
              </h2>
              <div className="mt-2 space-y-2">
                {list.length === 0 && <p className="px-2 py-4 text-center text-sm text-muted">Sin pedidos</p>}
                {list.map((o) => {
                  const step = nextStep(o);
                  const waitingPay = o.paymentMethod === "QR" && o.paymentStatus !== "VERIFIED";
                  const minutes = Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000);
                  return (
                    <article key={o.id} className={`card p-3 ${o.status === "CANCELLED" ? "opacity-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/admin/pedidos/${o.code}`} className="font-semibold hover:text-brand">{o.code}</Link>
                        <span className={`text-xs tabular-nums ${minutes > 20 && col.title !== "Cerrados hoy" ? "font-semibold text-red-700" : "text-muted"}`}>
                          hace {minutes} min
                        </span>
                      </div>
                      <p className="text-sm text-muted">
                        {o.table ? `Mesa ${o.table}` : ORDER_TYPE_LABEL[o.type]} · {o.customerName}
                      </p>
                      <ul className="my-2 text-sm">
                        {o.items.map((i, idx) => (
                          <li key={idx}>
                            <b>{i.quantity}×</b> {i.name}
                            {i.notes && <span className="block pl-5 text-xs text-amber-800">{i.notes}</span>}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <PaymentBadge status={o.paymentStatus} method={o.paymentMethod} />
                        <span className="font-semibold tabular-nums">{bs(o.total)}</span>
                      </div>
                      {o.status !== "DELIVERED" && o.status !== "CANCELLED" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {waitingPay && o.hasProof && (
                            <Link href={`/admin/pedidos/${o.code}`} className="btn-accent px-3 py-1.5 text-xs">Revisar comprobante</Link>
                          )}
                          {step && !(waitingPay && o.status === "PENDING") && (
                            <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => act(() => setOrderStatus(o.id, step.status))}>
                              {step.label}
                            </button>
                          )}
                          {waitingPay && o.status === "PENDING" && !o.hasProof && (
                            <span className="text-xs text-muted">Esperando comprobante</span>
                          )}
                          {o.paymentMethod === "QR" && o.paymentStatus === "PENDING" && o.hasProof && (
                            <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => act(() => verifyPayment(o.id, true))}>
                              Pago OK
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
