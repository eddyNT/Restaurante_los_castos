import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";

const ORDER_TONE: Record<string, string> = {
  PENDING: "bg-accent-soft text-amber-800",
  CONFIRMED: "bg-sky-50 text-sky-800",
  PREPARING: "bg-sky-50 text-sky-800",
  READY: "bg-brand-soft text-brand",
  OUT_FOR_DELIVERY: "bg-brand-soft text-brand",
  DELIVERED: "bg-canvas text-muted",
  CANCELLED: "bg-red-50 text-red-700",
};

const PAY_TONE: Record<string, string> = {
  PENDING: "bg-accent-soft text-amber-800",
  VERIFIED: "bg-brand-soft text-brand",
  REJECTED: "bg-red-50 text-red-700",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${ORDER_TONE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function PaymentBadge({ status, method }: { status: string; method: string }) {
  if (method === "CASH") return <span className="badge bg-canvas text-muted">Efectivo</span>;
  return <span className={`badge ${PAY_TONE[status]}`}>QR · {PAYMENT_STATUS_LABEL[status]}</span>;
}
