// Firma y verificación del token de sesión. Sin dependencias de Node para poder usarse en el middleware.
import { SignJWT, jwtVerify } from "jose";

export type Role = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";

export type SessionPayload = {
  sub: string;
  name: string;
  role: Role;
  branchIds: string[];
};

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 7;

const key = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

