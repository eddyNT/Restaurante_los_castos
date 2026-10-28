import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { bs, formatDate, ORDER_TYPE_LABEL } from "@/lib/format";
import { OrderStatusBadge } from "@/components/StatusBadge";

export const metadata = { title: "Mis pedidos" };

export default async function MyOrders() {
  const session = await requireRole("CUSTOMER", "ADMIN");
  const orders = await db.order.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">Mis pedidos</h1>
      {orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p>Todavía no hiciste pedidos.</p>
          <Link href="/menu" className="btn-primary mt-4">Ver el menú</Link>
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/pedidos/${o.code}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-canvas">
                <div>
                  <p className="font-semibold">{o.code}</p>
                  <p className="text-sm text-muted">
                    {formatDate(o.createdAt)} · {ORDER_TYPE_LABEL[o.type]} · {o._count.items} productos
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="font-semibold tabular-nums">{bs(o.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
