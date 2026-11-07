/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { branchScope, requireRole } from "@/lib/auth";
import { bs, formatDate, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, scheduleLabel } from "@/lib/format";
import { OrderStatusBadge, PaymentBadge } from "@/components/StatusBadge";
import { OrderActions } from "./OrderActions";

export default async function AdminOrder({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = await requireRole("ADMIN");
  const order = await db.order.findFirst({
    where: { code, ...branchScope(session) },
    include: {
      items: true,
      table: true,
      user: true,
      payments: { orderBy: { createdAt: "desc" }, include: { verifier: true } },
      history: { orderBy: { createdAt: "asc" }, include: { user: true } },
    },
  });
  if (!order) notFound();
  const payment = order.payments[0];

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin" className="text-sm font-semibold text-brand">← Tablero</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{order.code}</h1>
          <p className="text-sm text-muted">
            {formatDate(order.createdAt)} · {ORDER_TYPE_LABEL[order.type]}
            {order.table ? ` · Mesa ${order.table.number}` : ""}
          </p>
          {order.scheduledFor && (
            <p className="mt-1 inline-block rounded-full bg-accent-soft px-3 py-1 font-extrabold text-amber-900">
              🕐 {scheduleLabel(order.type, order.scheduledFor)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
      </div>

      <OrderActions
        orderId={order.id}
        status={order.status}
        type={order.type}
        canVerify={order.paymentMethod === "QR" && order.paymentStatus !== "VERIFIED"}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-2 font-display font-semibold">Detalle</h2>
          <ul className="divide-y divide-line text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2">
                <div>
                  <p><b>{i.quantity}×</b> {i.productName}</p>
                  {i.removed && <p className="font-extrabold uppercase text-red-700">Sin: {i.removed}</p>}
                  {i.notes && <p className="text-amber-800">{i.notes}</p>}
                </div>
                <span className="tabular-nums">{bs(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between border-t border-line pt-2 font-bold">
            <span>Total</span><span className="tabular-nums">{bs(order.total)}</span>
          </p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Cliente</dt><dd>{order.customerName}{order.user ? "" : " (invitado)"}</dd>
            <dt className="text-muted">Celular</dt><dd>{order.customerPhone}</dd>
            {order.deliveryAddress && <><dt className="text-muted">Dirección</dt><dd>{order.deliveryAddress}</dd></>}
            {order.notes && <><dt className="text-muted">Nota</dt><dd>{order.notes}</dd></>}
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="mb-2 font-display font-semibold">Pago</h2>
          {order.paymentMethod === "CASH" ? (
            <p className="text-sm">Efectivo al recibir: cobrar <b>{bs(order.total)}</b>.</p>
          ) : payment?.proofUrl ? (
            <a href={payment.proofUrl} target="_blank" rel="noopener">
              <img src={payment.proofUrl} alt="Comprobante de pago" className="max-h-96 rounded-lg border border-line" />
            </a>
          ) : (
            <p className="text-sm text-muted">El cliente todavía no subió el comprobante.</p>
          )}
          {payment?.verifier && (
            <p className="mt-2 text-xs text-muted">
              Revisado por {payment.verifier.fullName} · {payment.verifiedAt && formatDate(payment.verifiedAt)}
            </p>
          )}
          <h2 className="mb-2 mt-6 font-display font-semibold">Historial</h2>
          <ol className="space-y-1 text-sm">
            {order.history.map((h) => (
              <li key={h.id} className="flex justify-between gap-2">
                <span>{ORDER_STATUS_LABEL[h.status]}</span>
                <span className="text-muted">{h.user?.fullName ?? "Cliente"} · {formatDate(h.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
