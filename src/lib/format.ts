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

/** Hora en Bolivia, ej.: «13:30». */
export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/La_Paz" }).format(d);
}

const boliviaDay = (d: Date) => new Intl.DateTimeFormat("es-BO", { dateStyle: "short", timeZone: "America/La_Paz" }).format(d);

/** «13:30» si es hoy; «vie. 13:30» si es otro día (hora de Bolivia). */
export function formatSchedule(d: Date): string {
  if (boliviaDay(d) === boliviaDay(new Date())) return formatTime(d);
  const day = new Intl.DateTimeFormat("es-BO", { weekday: "short", timeZone: "America/La_Paz" }).format(d);
  return `${day} ${formatTime(d)}`;
}

/** «Recoge 13:30» / «Llega vie. 13:30» según el tipo de pedido. */
export function scheduleLabel(type: string, d: Date | null): string | null {
  if (!d) return null;
  return `${type === "DINE_IN" ? "Llega" : "Recoge"} ${formatSchedule(d)}`;
}

/** Enlace de WhatsApp con mensaje listo. Un celular boliviano de 8 dígitos se completa con el 591. */
export function whatsappLink(phone: string, text: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 8) digits = "591" + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
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
  DELIVERY: "Para casa",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pago pendiente",
  VERIFIED: "Pago verificado",
  REJECTED: "Pago rechazado",
};

export const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
