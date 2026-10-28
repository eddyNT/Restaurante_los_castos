import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import { PanelNav } from "./PanelNav";

const ADMIN_LINKS = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/mesas", label: "Mesas" },
  { href: "/admin/disponibilidad", label: "Platos agotados" },
];

const SUPER_LINKS = [
  { href: "/superadmin", label: "Resumen" },
  { href: "/superadmin/productos", label: "Productos y precios" },
  { href: "/superadmin/categorias", label: "Categorías" },
  { href: "/superadmin/clientes", label: "Clientes" },
  { href: "/superadmin/usuarios", label: "Trabajadores" },
  { href: "/superadmin/pagos-qr", label: "QR de pago" },
  { href: "/superadmin/configuracion", label: "Local y horarios" },
  { href: "/superadmin/auditoria", label: "Bitácora" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("ADMIN");
  const settings = await getSettings();
  const groups = [{ title: "Operación", links: ADMIN_LINKS }];
  if (session.role === "SUPER_ADMIN") groups.push({ title: "Administración", links: SUPER_LINKS });

  return (
    <div className="min-h-screen md:grid md:grid-cols-[230px_1fr]">
      <aside className="border-b border-line bg-brand-dark text-white md:min-h-screen md:border-b-0">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link href="/" className="font-display text-lg font-extrabold">{settings.restaurantName}</Link>
          <p className="text-xs text-white/60 md:mt-1">
            {session.name} · {session.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
          </p>
        </div>
        <PanelNav groups={groups} />
        <form action={logout} className="hidden px-4 py-4 md:block">
          <button className="text-sm text-white/70 hover:text-white">Cerrar sesión</button>
        </form>
      </aside>
      <main className="min-w-0 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
