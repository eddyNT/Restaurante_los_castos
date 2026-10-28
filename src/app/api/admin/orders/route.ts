import { NextResponse } from "next/server";
import { getSession, branchScope, isStaff } from "@/lib/auth";
import { db } from "@/lib/db";

// Pedidos activos para el tablero. El panel consulta esta ruta cada pocos segundos.
export async function GET() {
  const session = await getSession();
  if (!session || !isStaff(session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const since = new Date(Date.now() - 1000 * 60 * 60 * 12);
  const orders = await db.order.findMany({
    where: {
      ...branchScope(session),
      OR: [{ status: { notIn: ["DELIVERED", "CANCELLED"] } }, { updatedAt: { gte: since } }],
    },
    orderBy: { createdAt: "asc" },
    include: { items: true, table: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
    take: 200,
  });

  return NextResponse.json(
    orders.map((o) => ({
      id: o.id,
      code: o.code,
      type: o.type,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      hasProof: !!o.payments[0]?.proofUrl,
      total: Number(o.total),
      customerName: o.customerName,
      table: o.table?.number ?? null,
      createdAt: o.createdAt.toISOString(),
      items: o.items.map((i) => ({ name: i.productName, quantity: i.quantity, notes: i.notes })),
    })),
  );
}
