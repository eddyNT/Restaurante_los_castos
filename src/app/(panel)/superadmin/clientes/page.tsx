import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bs, formatDate } from "@/lib/format";

export const metadata = { title: "Clientes" };

export default async function CustomersAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole("SUPER_ADMIN");
  const { q } = await searchParams;
  const customers = await db.user.findMany({
    where: {
      role: { code: "CUSTOMER" },
      deletedAt: null,
      ...(q ? { OR: [{ fullName: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const stats = await db.order.groupBy({
    by: ["userId"],
    where: { userId: { in: customers.map((c) => c.id) }, status: { not: "CANCELLED" } },
    _count: true,
    _sum: { total: true },
    _max: { createdAt: true },
  });
  const byUser = new Map(stats.map((s) => [s.userId, s]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Clientes</h1>
        <a href="/api/superadmin/clientes.csv" className="btn-ghost">Exportar a Excel (CSV)</a>
      </div>
      <form>
        <input name="q" defaultValue={q} placeholder="Buscar por nombre, correo o celular" className="input max-w-md" aria-label="Buscar cliente" />
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Cliente</th><th>Contacto</th><th>Registro</th><th>Pedidos</th><th>Total gastado</th><th>Último pedido</th></tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const s = byUser.get(c.id);
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/superadmin/clientes/${c.id}`} className="font-semibold hover:text-brand">{c.fullName}</Link>
                    {!c.isActive && <span className="badge ml-2 bg-red-50 text-red-700">Desactivado</span>}
                  </td>
                  <td className="text-sm">{c.email}<br /><span className="text-muted">{c.phone}</span></td>
                  <td className="text-sm text-muted">{formatDate(c.createdAt)}</td>
                  <td className="tabular-nums">{s?._count ?? 0}</td>
                  <td className="tabular-nums">{bs(s?._sum.total ?? 0)}</td>
                  <td className="text-sm text-muted">{s?._max.createdAt ? formatDate(s._max.createdAt) : "—"}</td>
                </tr>
              );
            })}
            {customers.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted">No hay clientes que coincidan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
