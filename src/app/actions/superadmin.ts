"use server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { saveImage } from "@/lib/upload";
import { slugify } from "@/lib/format";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import type { FormState } from "./auth";

const sa = () => requireRole("SUPER_ADMIN");

function refreshMenu() {
  revalidatePath("/", "layout");
}

async function uniqueSlug(base: string, model: "product" | "category", excludeId?: string) {
  let slug = slugify(base) || "item";
  for (let i = 2; ; i++) {
    const found =
      model === "product"
        ? await db.product.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })
        : await db.category.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } });
    if (!found) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

// ---------- Productos ----------

const productSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto."),
  description: z.string().trim().max(1000).optional(),
  categoryId: z.string().min(1, "Elige una categoría."),
  basePrice: z.coerce.number().positive("El precio debe ser mayor a 0.").max(100000),
  ingredients: z
    .array(z.object({ name: z.string().trim().min(1).max(40), removable: z.boolean() }))
    .max(15, "Máximo 15 ingredientes.")
    .refine((l) => new Set(l.map((i) => i.name.toLowerCase())).size === l.length, "Hay ingredientes repetidos."),
});

function parseJson(v: FormDataEntryValue | null) {
  try {
    return JSON.parse(String(v ?? "[]"));
  } catch {
    return [];
  }
}

export async function saveProduct(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await sa();
  const id = String(form.get("id") || "");
  const parsed = productSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") || undefined,
    categoryId: form.get("categoryId"),
    basePrice: form.get("basePrice"),
    ingredients: parseJson(form.get("ingredients")),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let imageUrl: string | null = null;
  try {
    imageUrl = await saveImage(form.get("image") as File | null);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const data = {
    ...parsed.data,
    description: parsed.data.description ?? null,
    isVisible: form.get("isVisible") === "on",
    isFeatured: form.get("isFeatured") === "on",
    ...(imageUrl ? { imageUrl } : {}),
    ...(form.get("removeImage") === "on" && !imageUrl ? { imageUrl: null } : {}),
  };

  if (id) {
    const before = await db.product.findUniqueOrThrow({ where: { id } });
    await db.product.update({ where: { id }, data: { ...data, slug: await uniqueSlug(data.name, "product", id) } });
    if (Number(before.basePrice) !== data.basePrice) {
      await audit(session.sub, "price.update", "product", id, { name: data.name, from: Number(before.basePrice), to: data.basePrice });
    }
    await audit(session.sub, "update", "product", id, { name: data.name });
  } else {
    const p = await db.product.create({ data: { ...data, slug: await uniqueSlug(data.name, "product") } });
    await audit(session.sub, "create", "product", p.id, { name: p.name, price: data.basePrice });
  }
  refreshMenu();
  redirect("/superadmin/productos");
}

export async function quickPrice(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  const price = Number(form.get("price"));
  if (!(price > 0)) return;
  const before = await db.product.findUniqueOrThrow({ where: { id } });
  if (Number(before.basePrice) === price) return;
  await db.product.update({ where: { id }, data: { basePrice: price } });
  await audit(session.sub, "price.update", "product", id, { name: before.name, from: Number(before.basePrice), to: price });
  refreshMenu();
}

export async function toggleProductVisible(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  const p = await db.product.findUniqueOrThrow({ where: { id } });
  await db.product.update({ where: { id }, data: { isVisible: !p.isVisible } });
  await audit(session.sub, p.isVisible ? "hide" : "show", "product", id, { name: p.name });
  refreshMenu();
}

export async function deleteProduct(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  // Borrado lógico: los pedidos antiguos siguen mostrando el producto
  const p = await db.product.update({ where: { id }, data: { deletedAt: new Date(), isVisible: false } });
  await audit(session.sub, "delete", "product", id, { name: p.name });
  refreshMenu();
}

// ---------- Categorías ----------

export async function saveCategory(form: FormData) {
  const session = await sa();
  const id = String(form.get("id") || "");
  const name = String(form.get("name") ?? "").trim();
  const sortOrder = Number(form.get("sortOrder")) || 0;
  const isVisible = form.get("isVisible") === "on";
  if (name.length < 2) return;
  if (id) {
    await db.category.update({ where: { id }, data: { name, sortOrder, isVisible, slug: await uniqueSlug(name, "category", id) } });
    await audit(session.sub, "update", "category", id, { name });
  } else {
    const c = await db.category.create({ data: { name, sortOrder, isVisible, slug: await uniqueSlug(name, "category") } });
    await audit(session.sub, "create", "category", c.id, { name });
  }
  refreshMenu();
}

export async function deleteCategory(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  const count = await db.product.count({ where: { categoryId: id, deletedAt: null } });
  if (count > 0) return; // la interfaz solo ofrece borrar categorías vacías
  await db.product.updateMany({ where: { categoryId: id }, data: { isVisible: false } });
  const hasHistory = await db.product.count({ where: { categoryId: id } });
  if (hasHistory) await db.category.update({ where: { id }, data: { isVisible: false } });
  else await db.category.delete({ where: { id } });
  await audit(session.sub, "delete", "category", id);
  refreshMenu();
}

// ---------- Trabajadores ----------

const workerSchema = z.object({
  fullName: z.string().trim().min(3, "Escribe el nombre completo."),
  email: z.email("Correo no válido.").transform((e) => e.toLowerCase()),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
});

export async function createWorker(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await sa();
  const parsed = workerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { fullName, email, phone, password, role } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo." };
  const branchIds = form.getAll("branchIds").map(String);
  if (role === "ADMIN" && branchIds.length === 0) return { error: "Asigna al menos una sucursal." };
  const roleRow = await db.role.findUniqueOrThrow({ where: { code: role } });
  const user = await db.user.create({
    data: {
      fullName,
      email,
      phone: phone || null,
      roleId: roleRow.id,
      passwordHash: await bcrypt.hash(password, 10),
      branches: { create: branchIds.map((branchId) => ({ branchId })) },
    },
  });
  await audit(session.sub, "create", "user", user.id, { email, role });
  revalidatePath("/superadmin/usuarios");
  return { ok: `Cuenta creada para ${fullName}.` };
}

export async function toggleUserActive(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  if (id === session.sub) return;
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data: { isActive: !u.isActive } });
  await audit(session.sub, u.isActive ? "deactivate" : "activate", "user", id, { email: u.email });
  revalidatePath("/superadmin/usuarios");
  revalidatePath("/superadmin/clientes");
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await sa();
  const id = String(form.get("id"));
  const password = String(form.get("password") ?? "");
  if (password.length < 8) return { error: "Mínimo 8 caracteres." };
  await db.user.update({ where: { id }, data: { passwordHash: await bcrypt.hash(password, 10) } });
  await audit(session.sub, "password.reset", "user", id);
  return { ok: "Contraseña cambiada." };
}

// ---------- QR de pago ----------

export async function uploadPaymentQr(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await sa();
  const branchId = String(form.get("branchId"));
  const bankName = String(form.get("bankName") ?? "").trim();
  const accountHolder = String(form.get("accountHolder") ?? "").trim();
  if (!bankName || !accountHolder) return { error: "Escribe el banco y el titular de la cuenta." };
  let imageUrl: string | null;
  try {
    imageUrl = await saveImage(form.get("image") as File | null);
  } catch (e) {
    return { error: (e as Error).message };
  }
  if (!imageUrl) return { error: "Elige la imagen del QR." };
  const activate = form.get("activate") === "on";
  const qr = await db.$transaction(async (tx) => {
    if (activate) await tx.paymentQr.updateMany({ where: { branchId }, data: { isActive: false } });
    return tx.paymentQr.create({ data: { branchId, bankName, accountHolder, imageUrl, isActive: activate, uploadedBy: session.sub } });
  });
  await audit(session.sub, "create", "payment_qr", qr.id, { bankName, activate });
  revalidatePath("/superadmin/pagos-qr");
  return { ok: activate ? "QR cargado y activado." : "QR cargado." };
}

export async function activatePaymentQr(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  const qr = await db.paymentQr.findUniqueOrThrow({ where: { id } });
  await db.$transaction([
    db.paymentQr.updateMany({ where: { branchId: qr.branchId }, data: { isActive: false } }),
    db.paymentQr.update({ where: { id }, data: { isActive: true } }),
  ]);
  await audit(session.sub, "activate", "payment_qr", id, { bankName: qr.bankName });
  revalidatePath("/superadmin/pagos-qr");
}

export async function deactivatePaymentQr(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  await db.paymentQr.update({ where: { id }, data: { isActive: false } });
  await audit(session.sub, "deactivate", "payment_qr", id);
  revalidatePath("/superadmin/pagos-qr");
}

export async function deletePaymentQr(form: FormData) {
  const session = await sa();
  const id = String(form.get("id"));
  const used = await db.payment.count({ where: { paymentQrId: id } });
  if (used > 0) await db.paymentQr.update({ where: { id }, data: { isActive: false } });
  else await db.paymentQr.delete({ where: { id } });
  await audit(session.sub, "delete", "payment_qr", id);
  revalidatePath("/superadmin/pagos-qr");
}

// ---------- Configuración y sucursal ----------

export async function saveSettings(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await sa();
  const entries = Object.keys(DEFAULT_SETTINGS).map((key) => [key, String(form.get(key) ?? "").trim()] as const);
  await db.$transaction(
    entries.map(([key, value]) => db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
  await audit(session.sub, "update", "settings", undefined, Object.fromEntries(entries));
  revalidatePath("/", "layout");
  return { ok: "Configuración guardada." };
}

export async function saveBranch(_prev: FormState, form: FormData): Promise<FormState> {
  const session = await sa();
  const id = String(form.get("id"));
  const name = String(form.get("name") ?? "").trim();
  const address = String(form.get("address") ?? "").trim();
  if (!name || !address) return { error: "El nombre y la dirección son obligatorios." };
  const opt = (k: string) => String(form.get(k) ?? "").trim() || null;
  await db.$transaction(async (tx) => {
    await tx.branch.update({
      where: { id },
      data: { name, address, phone: opt("phone"), whatsapp: opt("whatsapp"), email: opt("email"), mapUrl: opt("mapUrl") },
    });
    for (let d = 0; d < 7; d++) {
      const data = {
        opensAt: String(form.get(`open-${d}`) || "08:00"),
        closesAt: String(form.get(`close-${d}`) || "22:00"),
        isClosed: form.get(`closed-${d}`) === "on",
      };
      await tx.branchHour.upsert({
        where: { branchId_dayOfWeek: { branchId: id, dayOfWeek: d } },
        update: data,
        create: { branchId: id, dayOfWeek: d, ...data },
      });
    }
  });
  await audit(session.sub, "update", "branch", id, { name });
  revalidatePath("/", "layout");
  return { ok: "Datos del local guardados." };
}
