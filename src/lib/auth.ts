import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession, type Role, type SessionPayload } from "./session";

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function startSession(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: { role: true, branches: true },
  });
  const token = await signSession({
    sub: user.id,
    name: user.fullName,
    role: user.role.code as Role,
    branchIds: user.branches.map((b) => b.branchId),
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Sesión válida y de una cuenta que sigue activa. Usar en rutas API, donde no se puede redirigir. */
export async function getActiveSession(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  // Una cuenta desactivada pierde el acceso aunque su token siga vigente
  const user = await db.user.findUnique({ where: { id: session.sub }, select: { isActive: true, deletedAt: true } });
  if (!user || !user.isActive || user.deletedAt) return null;
  return session;
}

/** Exige sesión con alguno de los roles. SUPER_ADMIN siempre pasa. */
export async function requireRole(...roles: Role[]): Promise<SessionPayload> {
  const session = await getActiveSession();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN" && !roles.includes(session.role)) redirect("/403");
  return session;
}

/** Filtro de sucursal: el Admin solo ve sus sucursales, el Super Admin todas. */
export function branchScope(session: SessionPayload) {
  return session.role === "SUPER_ADMIN" ? {} : { branchId: { in: session.branchIds } };
}

export function isStaff(session: SessionPayload | null) {
  return session?.role === "ADMIN" || session?.role === "SUPER_ADMIN";
}
