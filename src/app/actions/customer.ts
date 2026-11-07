"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession, requireRole } from "@/lib/auth";
import { canViewOrder } from "@/lib/orders";
import { saveImage } from "@/lib/upload";
import type { FormState } from "./auth";

export async function uploadProof(_prev: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code"));
  const order = await db.order.findUnique({ where: { code } });
  if (!order || !canViewOrder(order, await getSession())) return { error: "Pedido no encontrado." };
  if (order.paymentMethod !== "QR") return { error: "Este pedido se paga en efectivo." };
  if (order.status === "CANCELLED") return { error: "Este pedido fue cancelado." };
  if (order.paymentStatus === "VERIFIED") return { error: "Este pago ya fue verificado." };
  try {
    const url = await saveImage(form.get("proof") as File | null, "proof");
    if (!url) return { error: "Elige la captura del comprobante." };
    const pending = await db.payment.findFirst({ where: { orderId: order.id, method: "QR" }, orderBy: { createdAt: "desc" } });
    if (pending && pending.status !== "VERIFIED") {
      await db.payment.update({ where: { id: pending.id }, data: { proofUrl: url, status: "PENDING" } });
    } else {
      await db.payment.create({ data: { orderId: order.id, method: "QR", amount: order.total, proofUrl: url } });
    }
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/pedidos/${code}`);
  return { ok: "Comprobante enviado. Te avisaremos cuando lo verifiquemos." };
}

const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Escribe tu nombre completo."),
  phone: z.string().trim().min(7, "Escribe un teléfono válido."),
});

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("CUSTOMER", "ADMIN");
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.user.update({ where: { id: session.sub }, data: parsed.data });
  revalidatePath("/perfil");
  return { ok: "Datos guardados." };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("CUSTOMER", "ADMIN");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 8) return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  const user = await db.user.findUniqueOrThrow({ where: { id: session.sub } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "La contraseña actual no es correcta." };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: "Contraseña actualizada." };
}

export async function addAddress(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await requireRole("CUSTOMER", "ADMIN");
  const label = String(form.get("label") ?? "").trim();
  const line = String(form.get("line") ?? "").trim();
  const reference = String(form.get("reference") ?? "").trim();
  if (!label || line.length < 5) return { error: "Escribe un nombre y la dirección completa." };
  await db.address.create({ data: { userId: session.sub, label, line, reference: reference || null } });
  revalidatePath("/perfil");
  return { ok: "Dirección agregada." };
}

export async function deleteAddress(form: FormData) {
  const session = await requireRole("CUSTOMER", "ADMIN");
  await db.address.deleteMany({ where: { id: String(form.get("id")), userId: session.sub } });
  revalidatePath("/perfil");
}
