import "server-only";
import { randomInt } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { toMenuProduct } from "./menu";
import { getMainBranch, getSettings } from "./settings";
import { pickupSlots, slotToDate } from "./hours";
import { isStaff } from "./auth";
import type { SessionPayload } from "./session";

export const orderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        removed: z.array(z.string().max(40)).max(15).optional(),
        notes: z.string().max(120).optional(),
      }),
    )
    .min(1, "El carrito está vacío."),
  type: z.enum(["TAKEAWAY", "DINE_IN", "DELIVERY"]),
  /** «2026-10-30 13:30»: hora de recojo (para llevar) o de llegada (en mesa), en hora de Bolivia. */
  scheduledTime: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/).optional(),
  paymentMethod: z.enum(["CASH", "QR"]),
  customerName: z.string().trim().min(2, "Escribe tu nombre."),
  customerPhone: z.string().trim().min(7, "Escribe un celular válido."),
  deliveryAddress: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type OrderInput = z.infer<typeof orderInput>;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  return "P-" + Array.from({ length: 7 }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");
}

export class OrderError extends Error {}

/** Crea el pedido recalculando precios en el servidor. Nunca usa el precio enviado por el navegador. */
export async function createOrder(input: OrderInput, session: SessionPayload | null) {
  const branch = await getMainBranch();
  const settings = await getSettings();

  if (!session) throw new OrderError("Ingresa a tu cuenta para hacer un pedido.");
  const type = input.type;
  if (type === "DELIVERY" && !input.deliveryAddress) throw new OrderError("Escribe la dirección de entrega.");

  // Para llevar y en mesa: la hora debe ser uno de los turnos que siguen disponibles
  let scheduledFor: Date | null = null;
  if (type !== "DELIVERY") {
    if (!input.scheduledTime) throw new OrderError(type === "DINE_IN" ? "Elige a qué hora llegas." : "Elige a qué hora pasas a recoger.");
    const day = pickupSlots(branch.hours, Number(settings.prepMinutes) || 0);
    if (!day) throw new OrderError("No hay horarios disponibles esta semana para recoger o comer en el local.");
    if (!day.slots.some((s) => s.value === input.scheduledTime)) {
      throw new OrderError(`Esa hora ya no está disponible. La más temprana es ${day.label.toLowerCase()} a las ${day.slots[0].time}.`);
    }
    scheduledFor = slotToDate(input.scheduledTime);
  }

  let paymentQrId: string | null = null;
  if (input.paymentMethod === "QR") {
    const qr = await db.paymentQr.findFirst({ where: { branchId: branch.id, isActive: true } });
    if (!qr) throw new OrderError("El pago con QR no está disponible por ahora. Elige efectivo.");
    paymentQrId = qr.id;
  }

  const ids = input.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: ids }, isVisible: true, deletedAt: null },
    include: { branchProducts: { where: { branchId: branch.id } } },
  });
  const byId = new Map(products.map((p) => [p.id, toMenuProduct(p)]));

  const lines = input.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new OrderError("Un producto de tu carrito ya no está en el menú. Revisa el carrito.");
    if (!p.isAvailable) throw new OrderError(`${p.name} está agotado hoy. Quítalo del carrito para continuar.`);
    // Solo se puede quitar lo que el menú marca como removible; quitar algo no cambia el precio
    const removable = new Set(p.ingredients.filter((g) => g.removable).map((g) => g.name));
    const removed = [...new Set(i.removed ?? [])];
    if (removed.some((r) => !removable.has(r))) {
      throw new OrderError(`Los ingredientes de ${p.name} cambiaron. Quítalo del carrito y vuelve a agregarlo.`);
    }
    const unit = new Prisma.Decimal(p.price);
    return {
      productId: p.id,
      productName: p.name,
      unitPrice: unit,
      quantity: i.quantity,
      lineTotal: unit.mul(i.quantity),
      notes: i.notes || null,
      removed: removed.length ? removed.join(", ") : null,
    };
  });

  const subtotal = lines.reduce((s, l) => s.add(l.lineTotal), new Prisma.Decimal(0));
  const deliveryFee = new Prisma.Decimal(type === "DELIVERY" ? Number(settings.deliveryFee) || 0 : 0);
  const total = subtotal.add(deliveryFee);

  // Un solo create anidado: pedido, líneas, historial y pago se guardan juntos o no se guarda nada
  return db.order.create({
    data: {
      code: newCode(),
      branchId: branch.id,
      userId: session.sub,
      type,
      paymentMethod: input.paymentMethod,
      subtotal,
      deliveryFee,
      total,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: type === "DELIVERY" ? input.deliveryAddress : null,
      notes: input.notes || null,
      scheduledFor,
      items: { create: lines },
      history: { create: { status: "PENDING", changedBy: session.sub } },
      payments: { create: { method: input.paymentMethod, amount: total, paymentQrId } },
    },
  });
}

/** Un pedido con cuenta solo lo ve su dueño o el personal; uno de invitado (pedidos antiguos en mesa), quien tenga el código. */
export function canViewOrder(order: { userId: string | null; branchId: string }, session: SessionPayload | null) {
  if (!order.userId) return true;
  if (!session) return false;
  if (session.sub === order.userId) return true;
  if (session.role === "SUPER_ADMIN") return true;
  return isStaff(session) && session.branchIds.includes(order.branchId);
}
