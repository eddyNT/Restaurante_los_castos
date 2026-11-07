"use server";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { branchScope, requireRole } from "@/lib/auth";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

async function staffOrder(orderId: string) {
  const session = await requireRole("ADMIN");
  const order = await db.order.findFirst({ where: { id: orderId, ...branchScope(session) } });
  if (!order) throw new Error("Pedido no encontrado.");
  return { session, order };
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  if (!STATUSES.includes(status)) throw new Error("Estado no válido.");
  const { session, order } = await staffOrder(orderId);
  // Se puede corregir entre estados intermedios, pero un pedido cerrado no se reabre ni vuelve a «Recibido»
  if (order.status === status) return;
  if (order.status === "DELIVERED" || order.status === "CANCELLED") throw new Error("El pedido ya está cerrado.");
  if (status === "PENDING") throw new Error("Un pedido no puede volver a «Recibido».");
  if (status === "OUT_FOR_DELIVERY" && order.type !== "DELIVERY") throw new Error("Solo un delivery puede salir a entregar.");
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status, changedBy: session.sub } });
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${order.code}`);
}

export async function verifyPayment(orderId: string, approve: boolean) {
  const { session, order } = await staffOrder(orderId);
  if (order.paymentMethod !== "QR") throw new Error("Solo se verifican pagos por QR.");
  if (order.status === "CANCELLED") throw new Error("El pedido está cancelado.");
  if (order.paymentStatus === "VERIFIED") return;
  const status = approve ? "VERIFIED" : "REJECTED";
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({ where: { orderId: order.id, method: "QR" }, orderBy: { createdAt: "desc" } });
    if (payment) {
      await tx.payment.update({ where: { id: payment.id }, data: { status, verifiedBy: session.sub, verifiedAt: new Date() } });
    }
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: status, ...(approve && order.status === "PENDING" ? { status: "CONFIRMED" } : {}) },
    });
    if (approve && order.status === "PENDING") {
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CONFIRMED", changedBy: session.sub } });
    }
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${order.code}`);
}

export async function setAvailability(form: FormData) {
  const session = await requireRole("ADMIN");
  const productId = String(form.get("productId"));
  const branchId = String(form.get("branchId"));
  if (session.role !== "SUPER_ADMIN" && !session.branchIds.includes(branchId)) return;
  const isAvailable = form.get("available") === "1";
  await db.branchProduct.upsert({
    where: { branchId_productId: { branchId, productId } },
    update: { isAvailable },
    create: { branchId, productId, isAvailable },
  });
  revalidatePath("/admin/disponibilidad");
  revalidatePath("/menu");
}
