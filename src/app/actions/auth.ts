"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { endSession, startSession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

const HOME_BY_ROLE: Record<string, string> = { SUPER_ADMIN: "/superadmin", ADMIN: "/admin", CUSTOMER: "/menu" };

function safeNext(next: FormDataEntryValue | null) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : null;
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email }, include: { role: true } });
  if (!user || user.deletedAt || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos." };
  }
  if (!user.isActive) return { error: "Tu cuenta está desactivada. Habla con el administrador." };
  await startSession(user.id);
  redirect(safeNext(form.get("next")) ?? HOME_BY_ROLE[user.role.code]);
}

const registerSchema = z.object({
  fullName: z.string().trim().min(3, "Escribe tu nombre completo."),
  email: z.email("Correo no válido.").transform((e) => e.toLowerCase()),
  phone: z.string().trim().min(7, "Escribe un teléfono válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function register(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { fullName, email, phone, password } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "Ya existe una cuenta con ese correo." };
  const role = await db.role.findUniqueOrThrow({ where: { code: "CUSTOMER" } });
  const user = await db.user.create({
    data: { fullName, email, phone, passwordHash: await bcrypt.hash(password, 10), roleId: role.id },
  });
  await startSession(user.id);
  redirect(safeNext(form.get("next")) ?? "/menu");
}

export async function logout() {
  await endSession();
  redirect("/");
}
