import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const RULES: { prefix: string; roles: string[] }[] = [
  { prefix: "/superadmin", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  { prefix: "/perfil", roles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/pedidos", roles: ["CUSTOMER", "ADMIN", "SUPER_ADMIN"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();

  // El seguimiento de un pedido concreto es accesible por su código (pedidos de invitado en mesa)
  if (rule.prefix === "/pedidos" && pathname !== "/pedidos") return NextResponse.next();

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!rule.roles.includes(session.role)) return NextResponse.redirect(new URL("/403", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/superadmin/:path*", "/admin/:path*", "/perfil/:path*", "/pedidos/:path*"],
};
