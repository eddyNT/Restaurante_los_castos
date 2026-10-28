import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bs } from "@/lib/format";

export const metadata = { title: "Resumen" };

function startOfDayBolivia(daysAgo = 0) {
  // Bolivia es UTC-4 todo el año
  const now = new Date(Date.now() - 4 * 3600 * 1000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysAgo, 4));
  return d;
}

export default async function SuperDashboard() {
  await requireRole("SUPER_ADMIN");
  const today = startOfDayBolivia();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 4));
  const valid = { status: { not: "CANCELLED" as const } };

  const [dayAgg, monthAgg, pendingPays, customers, top, last7] = await Promise.all([
    db.order.aggregate({ where: { ...valid, createdAt: { gte: today } }, _sum: { total: true }, _count: true }),
    db.order.aggregate({ where: { ...valid, createdAt: { gte: monthStart } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { paymentMethod: "QR", paymentStatus: "PENDING", status: { not: "CANCELLED" } } }),
    db.user.count({ where: { role: { code: "CUSTOMER" } } }),
    db.orderItem.groupBy({
      by: ["productName"],
      where: { order: { ...valid, createdAt: { gte: monthStart } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.order.findMany({ where: { ...valid, createdAt: { gte: startOfDayBolivia(6) } }, select: { total: true, createdAt: true } }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const start = startOfDayBolivia(6 - i);
    const end = new Date(start.getTime() + 86400000);
    const total = last7.filter((o) => o.createdAt >= start && o.createdAt < end).reduce((s, o) => s + Number(o.total), 0);
    return { label: new Intl.DateTimeFormat("es-BO", { weekday: "short", timeZone: "America/La_Paz" }).format(start), total };
  });
  const max = Math.max(...days.map((d) => d.total), 1);
  const monthCount = monthAgg._count;
  const avg = monthCount ? Number(monthAgg._sum.total ?? 0) / monthCount : 0;

  const tiles = [
    { label: "Ventas de hoy", value: bs(dayAgg._sum.total ?? 0), sub: `${dayAgg._count} pedidos` },
    { label: "Ventas del mes", value: bs(monthAgg._sum.total ?? 0), sub: `${monthCount} pedidos` },
    { label: "Ticket promedio", value: bs(avg), sub: "Este mes" },
    { label: "Clientes registrados", value: String(customers), sub: "Total" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Resumen</h1>
      {pendingPays > 0 && (
        <Link href="/admin" className="block rounded-xl bg-accent-soft px-4 py-3 text-sm font-semibold">
          {pendingPays} pagos QR esperan verificación →
        </Link>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">{t.value}</p>
            <p className="text-sm text-muted">{t.sub}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-4 font-display font-semibold">Ventas de los últimos 7 días</h2>
          <div className="flex h-48 items-end gap-2">
            {days.map((d, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[11px] text-muted tabular-nums">{d.total ? Math.round(d.total) : ""}</span>
                <div className="w-full rounded-t-md bg-brand" style={{ height: `${(d.total / max) * 100}%`, minHeight: d.total ? 4 : 1 }} />
                <span className="text-xs text-muted">{d.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">Montos en bolivianos, sin pedidos cancelados.</p>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-display font-semibold">Más vendidos del mes</h2>
          {top.length === 0 && <p className="text-sm text-muted">Aún no hay ventas este mes.</p>}
          <ol className="space-y-2 text-sm">
            {top.map((t, i) => (
              <li key={t.productName} className="flex justify-between gap-2">
                <span>{i + 1}. {t.productName}</span>
                <span className="text-muted tabular-nums">{t._sum.quantity} u · {bs(t._sum.lineTotal ?? 0)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
