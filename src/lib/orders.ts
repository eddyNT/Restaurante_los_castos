import "server-only";
import { randomInt } from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { toMenuProduct } from "./menu";
import { getMainBranch, getSettings } from "./settings";
import { isStaff } from "./auth";
import type { SessionPayload } from "./session";

export const orderInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
        notes: z.string().max(120).optional(),
      }),
    )
    .min(1, "El carrito está vacío."),
  type: z.enum(["DINE_IN", "TAKEAWAY", "DELIVERY"]),
  paymentMethod: z.enum(["CASH", "QR"]),
  tableToken: z.string().optional().nullable(),
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

  let tableId: string | null = null;
  let type = input.type;
  if (input.tableToken) {
    const table = await db.diningTable.findUnique({ where: { qrToken: input.tableToken } });
    if (!table || table.branchId !== branch.id) throw new OrderError("La mesa no es válida. Vuelve a escanear el QR.");
    tableId = table.id;
    type = "DINE_IN";
  } else if (!session) {
    throw new OrderError("Ingresa a tu cuenta para hacer un pedido.");
  } else if (type === "DINE_IN") {
    throw new OrderError("Para pedir en mesa escanea el QR de tu mesa.");
  }
  if (type === "DELIVERY" && !input.deliveryAddress) throw new OrderError("Escribe la dirección de entrega.");

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
    const unit = new Prisma.Decimal(p.price);
    return {
      productId: p.id,
      productName: p.name,
      unitPrice: unit,
      quantity: i.quantity,
      lineTotal: unit.mul(i.quantity),
      notes: i.notes || null,
    };
  });

  const subtotal = lines.reduce((s, l) => s.add(l.lineTotal), new Prisma.Decimal(0));
  const deliveryFee = new Prisma.Decimal(type === "DELIVERY" ? Number(settings.deliveryFee) || 0 : 0);
  const total = subtotal.add(deliveryFee);

  return db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        code: newCode(),
        branchId: branch.id,
        userId: session?.sub ?? null,
        tableId,
        type,
        paymentMethod: input.paymentMethod,
        subtotal,
        deliveryFee,
        total,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: type === "DELIVERY" ? input.deliveryAddress : null,
        notes: input.notes || null,
        items: { create: lines },
        history: { create: { status: "PENDING", changedBy: session?.sub ?? null } },
        payments: { create: { method: input.paymentMethod, amount: total, paymentQrId } },
      },
    });
    if (tableId) await tx.diningTable.update({ where: { id: tableId }, data: { status: "OCCUPIED" } });
    return order;
  });
}

/** Un pedido con cuenta solo lo ve su dueño o el personal; uno de invitado, quien tenga el código. */
export function canViewOrder(order: { userId: string | null; branchId: string }, session: SessionPayload | null) {
  if (!order.userId) return true;
  if (!session) return false;
  if (session.sub === order.userId) return true;
  if (session.role === "SUPER_ADMIN") return true;
  return isStaff(session) && session.branchIds.includes(order.branchId);
}
