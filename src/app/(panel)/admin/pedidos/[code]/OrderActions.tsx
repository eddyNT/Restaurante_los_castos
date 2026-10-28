"use client";
import { useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import { setOrderStatus, verifyPayment } from "@/app/actions/staff";
import { ORDER_STATUS_LABEL } from "@/lib/format";

export function OrderActions({
  orderId,
  status,
  type,
  canVerify,
}: {
  orderId: string;
  status: OrderStatus;
  type: string;
  canVerify: boolean;
}) {
  const [pending, start] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const closed = status === "DELIVERED" || status === "CANCELLED";
  const flow: OrderStatus[] = ["CONFIRMED", "PREPARING", "READY", ...(type === "DELIVERY" ? (["OUT_FOR_DELIVERY"] as OrderStatus[]) : []), "DELIVERED"];

  return (
    <div className={`card flex flex-wrap items-center gap-2 p-4 ${pending ? "opacity-60" : ""}`}>
      {canVerify && (
        <>
          <button className="btn-primary" disabled={pending} onClick={() => start(() => verifyPayment(orderId, true))}>Aprobar pago</button>
          <button className="btn-danger" disabled={pending} onClick={() => start(() => verifyPayment(orderId, false))}>Rechazar pago</button>
          <span className="mx-2 h-6 w-px bg-line" />
        </>
      )}
      {!closed &&
        flow.map((s) => (
          <button
            key={s}
            className={s === status ? "btn-primary" : "btn-ghost"}
            disabled={pending || s === status}
            onClick={() => start(() => setOrderStatus(orderId, s))}
          >
            {ORDER_STATUS_LABEL[s]}
          </button>
        ))}
      {!closed &&
        (confirmCancel ? (
          <span className="flex items-center gap-2 text-sm">
            ¿Cancelar el pedido?
            <button className="btn-danger" onClick={() => start(() => setOrderStatus(orderId, "CANCELLED"))}>Sí, cancelar</button>
            <button className="btn-ghost" onClick={() => setConfirmCancel(false)}>No</button>
          </span>
        ) : (
          <button className="ml-auto text-sm text-red-700 hover:underline" onClick={() => setConfirmCancel(true)}>Cancelar pedido</button>
        ))}
      {closed && <p className="text-sm text-muted">Pedido cerrado.</p>}
    </div>
  );
}
