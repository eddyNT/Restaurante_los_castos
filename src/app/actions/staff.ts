"use server";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
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
  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status } });
    await tx.orderStatusHistory.create({ data: { orderId: order.id, status, changedBy: session.sub } });
    // Al cerrar un pedido de mesa, la mesa vuelve a quedar libre si no tiene otros pedidos abiertos
    if (order.tableId && (status === "DELIVERED" || status === "CANCELLED")) {
      const open = await tx.order.count({
        where: { tableId: order.tableId, id: { not: order.id }, status: { notIn: ["DELIVERED", "CANCELLED"] } },
      });
      if (open === 0) await tx.diningTable.update({ where: { id: order.tableId }, data: { status: "FREE" } });
    }
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/pedidos/${order.code}`);
}

export async function verifyPayment(orderId: string, approve: boolean) {
  const { session, order } = await staffOrder(orderId);
  const status = approve ? "VERIFIED" : "REJECTED";
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });
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

export async function setTableStatus(form: FormData) {
  const session = await requireRole("ADMIN");
  const status = String(form.get("status"));
  if (!["FREE", "OCCUPIED", "RESERVED"].includes(status)) return;
  await db.diningTable.updateMany({
    where: { id: String(form.get("id")), ...branchScope(session) },
    data: { status: status as "FREE" | "OCCUPIED" | "RESERVED" },
  });
  revalidatePath("/admin/mesas");
}

export async function addTable(form: FormData) {
  await requireRole("SUPER_ADMIN");
  const branchId = String(form.get("branchId"));
  const number = String(form.get("number") ?? "").trim();
  const capacity = Number(form.get("capacity")) || 4;
  if (!number) return;
  const exists = await db.diningTable.findUnique({ where: { branchId_number: { branchId, number } } });
  if (!exists) {
    await db.diningTable.create({ data: { branchId, number, capacity, qrToken: randomBytes(8).toString("hex") } });
  }
  revalidatePath("/admin/mesas");
}

export async function deleteTable(form: FormData) {
  await requireRole("SUPER_ADMIN");
  const id = String(form.get("id"));
  const used = await db.order.count({ where: { tableId: id } });
  if (used > 0) {
    // Una mesa con historial no se borra: se le genera un QR nuevo para invalidar el anterior
    await db.diningTable.update({ where: { id }, data: { qrToken: randomBytes(8).toString("hex") } });
  } else {
    await db.diningTable.delete({ where: { id } });
  }
  revalidatePath("/admin/mesas");
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
