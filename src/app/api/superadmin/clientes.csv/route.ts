import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") return new Response("No autorizado", { status: 401 });

  const customers = await db.user.findMany({
    where: { role: { code: "CUSTOMER" }, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { orders: { where: { status: { not: "CANCELLED" } }, select: { total: true } } },
  });
  const rows = [
    ["Nombre", "Correo", "Celular", "Fecha de registro", "Pedidos", "Total gastado (Bs)"],
    ...customers.map((c) => [
      c.fullName,
      c.email,
      c.phone,
      c.createdAt.toISOString().slice(0, 10),
      c.orders.length,
      c.orders.reduce((s, o) => s + Number(o.total), 0).toFixed(2),
    ]),
  ];
  // BOM para que Excel abra bien las tildes; punto y coma como separador regional
  const csv = "﻿" + rows.map((r) => r.map(cell).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
