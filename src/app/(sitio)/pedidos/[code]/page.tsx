/* eslint-disable @next/next/no-img-element */
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canViewOrder } from "@/lib/orders";
import { bs, formatDate, formatSchedule, ORDER_STATUS_LABEL, ORDER_TYPE_LABEL, scheduleLabel, whatsappLink } from "@/lib/format";
import { OrderStatusBadge, PaymentBadge } from "@/components/StatusBadge";
import { AutoRefresh } from "@/components/AutoRefresh";
import { ProofForm } from "./ProofForm";
import { OrderShare } from "./OrderShare";

export const dynamic = "force-dynamic";

const STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];

export default async function OrderPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const order = await db.order.findUnique({
    where: { code },
    include: {
      items: true,
      table: true,
      branch: { select: { whatsapp: true } },
      payments: { orderBy: { createdAt: "desc" }, include: { paymentQr: true } },
    },
  });
  if (!order || !canViewOrder(order, await getSession())) notFound();

  const qrPayment = order.payments.find((p) => p.method === "QR");
  const qr = qrPayment?.paymentQr ?? null;
  const stepIndex = STEPS.indexOf(order.status === "OUT_FOR_DELIVERY" ? "READY" : order.status);
  const needsPayment = order.paymentMethod === "QR" && order.paymentStatus !== "VERIFIED" && order.status !== "CANCELLED";

  // Datos del pedido para el QR y el mensaje de WhatsApp; el enlace abre el pedido en el panel del local
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const summary = [
    `PEDIDO ${order.code}`,
    `Cliente: ${order.customerName}`,
    `Celular: ${order.customerPhone}`,
    `Tipo: ${ORDER_TYPE_LABEL[order.type]}${order.scheduledFor ? ` · ${scheduleLabel(order.type, order.scheduledFor)}` : ""}`,
    ...(order.deliveryAddress ? [`Dirección: ${order.deliveryAddress}`] : []),
    ...order.items.map((i) => `${i.quantity}x ${i.productName}${i.removed ? ` (sin ${i.removed.toLowerCase()})` : ""}${i.notes ? ` - ${i.notes}` : ""}`),
    ...(order.notes ? [`Nota: ${order.notes}`] : []),
    `Total: ${bs(order.total)} · ${order.paymentMethod === "QR" ? "Pago QR" : "Efectivo"}`,
    `${origin}/admin/pedidos/${order.code}`,
  ].join("\n");
  const qrDataUrl = await QRCode.toDataURL(summary, { width: 400, margin: 1, errorCorrectionLevel: "M" });
  const whatsapp = order.branch.whatsapp;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AutoRefresh seconds={10} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Pedido</p>
          <h1 className="text-3xl font-extrabold">{order.code}</h1>
          <p className="text-sm text-muted">
            {formatDate(order.createdAt)} · {ORDER_TYPE_LABEL[order.type]}
            {order.table ? ` · Mesa ${order.table.number}` : ""}
          </p>
          {order.scheduledFor && (
            <p className="mt-1 font-semibold">
              🕐 {order.type === "DINE_IN" ? "Te esperamos:" : "Pasa a recoger:"} {formatSchedule(order.scheduledFor)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
      </div>

      {order.status !== "CANCELLED" && (
        <ol className="grid grid-cols-5 gap-1 text-center text-xs">
          {STEPS.map((s, i) => (
            <li key={s}>
              <div className={`mb-1 h-1.5 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-line"}`} />
              <span className={i === stepIndex ? "font-semibold text-brand" : "text-muted"}>
                {s === "READY" && order.status === "OUT_FOR_DELIVERY" ? "En camino" : ORDER_STATUS_LABEL[s]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {order.status !== "CANCELLED" && (
        <OrderShare
          code={order.code}
          qrDataUrl={qrDataUrl}
          whatsappUrl={whatsapp ? whatsappLink(whatsapp, summary) : null}
          whatsappNumber={whatsapp}
        />
      )}

      {needsPayment && (
        <section className="card grid gap-6 p-6 sm:grid-cols-[220px_1fr]">
          {qr ? (
            <div className="text-center">
              <img src={qr.imageUrl} alt={`QR de pago ${qr.bankName}`} className="mx-auto w-full max-w-[220px] rounded-lg border border-line" />
              <a href={qr.imageUrl} download className="mt-2 inline-block text-sm font-semibold text-brand">Descargar QR</a>
            </div>
          ) : (
            <p className="text-muted">El QR no está disponible. Pregunta en caja.</p>
          )}
          <div>
            <h2 className="text-xl font-extrabold">Paga con QR</h2>
            <p className="mt-1 text-3xl font-bold tabular-nums">{bs(order.total)}</p>
            {qr && (
              <p className="text-sm text-muted">
                {qr.bankName} · {qr.accountHolder}
              </p>
            )}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              <li>Escanea el QR desde la app de tu banco o descárgalo y súbelo.</li>
              <li>Paga el monto exacto y escribe <b>{order.code}</b> como referencia.</li>
              <li>Sube la captura del comprobante.</li>
            </ol>
            {order.paymentStatus === "REJECTED" && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                No pudimos confirmar tu pago. Revisa el monto y vuelve a subir el comprobante.
              </p>
            )}
            {qrPayment?.proofUrl && order.paymentStatus === "PENDING" ? (
              <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm">
                Recibimos tu comprobante. Lo estamos verificando.
              </p>
            ) : (
              <ProofForm code={order.code} />
            )}
          </div>
        </section>
      )}

      <section className="card p-5">
        <ul className="divide-y divide-line">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <div>
                <p>{i.quantity} × {i.productName}</p>
                {i.removed && <p className="text-sm font-bold text-brand">Sin {i.removed.toLowerCase()}</p>}
                {i.notes && <p className="text-sm text-muted">{i.notes}</p>}
              </div>
              <span className="tabular-nums">{bs(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{bs(order.deliveryFee)}</span></div>
          )}
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="tabular-nums">{bs(order.total)}</span></div>
        </div>
        {order.deliveryAddress && <p className="mt-3 text-sm text-muted">Entrega en: {order.deliveryAddress}</p>}
      </section>
    </div>
  );
}
