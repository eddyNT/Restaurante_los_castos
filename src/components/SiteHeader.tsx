import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import { CartLink } from "./CartLink";

export async function SiteHeader() {
  const [session, settings] = await Promise.all([getSession(), getSettings()]);
  const panel = session?.role === "SUPER_ADMIN" ? "/superadmin" : session?.role === "ADMIN" ? "/admin" : null;

  return (
    <header className="sticky top-0 z-30 bg-brand text-white shadow-lg shadow-brand/20">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent font-display text-xl text-brand">
            {settings.restaurantName.charAt(0)}
          </span>
          <span className="font-display text-2xl leading-none">{settings.restaurantName}</span>
        </Link>
        <nav className="ml-6 hidden gap-1 text-sm font-extrabold md:flex">
          <Link href="/menu" className="rounded-full px-3 py-2 hover:bg-white/15">Menú</Link>
          <Link href="/sucursales" className="rounded-full px-3 py-2 hover:bg-white/15">Horarios y contacto</Link>
          <Link href="/app" className="rounded-full px-3 py-2 hover:bg-white/15">Descargar app</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {session ? (
            <>
              {panel && (
                <Link href={panel} className="hidden rounded-full bg-white/15 px-4 py-2 text-sm font-extrabold hover:bg-white/25 sm:inline-flex">
                  Panel
                </Link>
              )}
              <Link href="/pedidos" className="hidden rounded-full px-3 py-2 text-sm font-extrabold hover:bg-white/15 sm:inline-flex">
                Mis pedidos
              </Link>
              <Link href="/perfil" className="rounded-full bg-white/15 px-4 py-2 text-sm font-extrabold hover:bg-white/25" title="Mi perfil">
                {session.name.split(" ")[0]}
              </Link>
              <form action={logout}>
                <button className="px-1 text-sm font-bold text-white/75 hover:text-white">Salir</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-brand hover:bg-accent-soft">
              Ingresar
            </Link>
          )}
          <CartLink />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm font-extrabold md:hidden">
        <Link href="/menu" className="rounded-full bg-white/15 px-3 py-1.5">Menú</Link>
        <Link href="/sucursales" className="rounded-full px-3 py-1.5">Horarios</Link>
        <Link href="/app" className="rounded-full px-3 py-1.5">App</Link>
        {session && <Link href="/pedidos" className="rounded-full px-3 py-1.5">Mis pedidos</Link>}
        {panel && <Link href={panel} className="rounded-full px-3 py-1.5">Panel</Link>}
      </nav>
      <div className="stripe h-1.5" />
    </header>
  );
}
