import type { Prisma } from "@prisma/client";

type Num = number | string | Prisma.Decimal;

export function toNumber(v: Num): number {
  return typeof v === "number" ? v : Number(v.toString());
}

export function bs(v: Num): string {
  return "Bs " + toNumber(v).toFixed(2);
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: "Recibido",
  CONFIRMED: "Confirmado",
  PREPARING: "En preparación",
  READY: "Listo",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const ORDER_TYPE_LABEL: Record<string, string> = {
  DINE_IN: "En mesa",
  TAKEAWAY: "Para llevar",
  DELIVERY: "Delivery",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pago pendiente",
  VERIFIED: "Pago verificado",
  REJECTED: "Pago rechazado",
};

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
