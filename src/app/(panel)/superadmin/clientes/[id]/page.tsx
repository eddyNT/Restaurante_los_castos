import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bs, formatDate, ORDER_TYPE_LABEL } from "@/lib/format";
import { toggleUserActive } from "@/app/actions/superadmin";
import { OrderStatusBadge } from "@/components/StatusBadge";

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SUPER_ADMIN");
  const { id } = await params;
  const c = await db.user.findFirst({
    where: { id, role: { code: "CUSTOMER" } },
    include: { addresses: true, orders: { orderBy: { createdAt: "desc" }, take: 100 } },
  });
  if (!c) notFound();
  const valid = c.orders.filter((o) => o.status !== "CANCELLED");
  const spent = valid.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/superadmin/clientes" className="text-sm font-semibold text-brand">← Clientes</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{c.fullName}</h1>
          <p className="text-muted">{c.email} · {c.phone}</p>
          <p className="text-sm text-muted">
            Cliente desde {formatDate(c.createdAt)}{c.lastLoginAt ? ` · Último ingreso ${formatDate(c.lastLoginAt)}` : ""}
          </p>
        </div>
        <form action={toggleUserActive}>
          <input type="hidden" name="id" value={c.id} />
          <button className={c.isActive ? "btn-danger" : "btn-primary"}>{c.isActive ? "Desactivar cuenta" : "Reactivar cuenta"}</button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs uppercase text-muted">Pedidos</p><p className="text-2xl font-bold">{valid.length}</p></div>
        <div className="card p-4"><p className="text-xs uppercase text-muted">Total gastado</p><p className="text-2xl font-bold tabular-nums">{bs(spent)}</p></div>
        <div className="card p-4"><p className="text-xs uppercase text-muted">Ticket promedio</p><p className="text-2xl font-bold tabular-nums">{bs(valid.length ? spent / valid.length : 0)}</p></div>
      </div>
      {c.addresses.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-2 font-display font-semibold">Direcciones</h2>
          <ul className="text-sm">{c.addresses.map((a) => <li key={a.id}><b>{a.label}:</b> {a.line}</li>)}</ul>
        </section>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Pedido</th><th>Fecha</th><th>Tipo</th><th>Estado</th><th>Total</th></tr></thead>
          <tbody>
            {c.orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/pedidos/${o.code}`} className="font-semibold hover:text-brand">{o.code}</Link></td>
                <td className="text-sm text-muted">{formatDate(o.createdAt)}</td>
                <td className="text-sm">{ORDER_TYPE_LABEL[o.type]}</td>
                <td><OrderStatusBadge status={o.status} /></td>
                <td className="tabular-nums">{bs(o.total)}</td>
              </tr>
            ))}
            {c.orders.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted">Sin pedidos.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
