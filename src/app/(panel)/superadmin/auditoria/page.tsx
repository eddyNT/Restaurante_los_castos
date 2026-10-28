import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Bitácora" };

const ACTION: Record<string, string> = {
  create: "Creó",
  update: "Editó",
  delete: "Eliminó",
  hide: "Ocultó",
  show: "Mostró",
  activate: "Activó",
  deactivate: "Desactivó",
  "price.update": "Cambió precio",
  "password.reset": "Cambió contraseña",
};

const ENTITY: Record<string, string> = {
  product: "producto",
  category: "categoría",
  user: "usuario",
  payment_qr: "QR de pago",
  settings: "configuración",
  branch: "sucursal",
};

function detail(changes: unknown) {
  if (!changes || typeof changes !== "object") return "";
  const c = changes as Record<string, unknown>;
  if ("from" in c && "to" in c) return `${c.name}: Bs ${c.from} → Bs ${c.to}`;
  return String(c.name ?? c.email ?? c.bankName ?? "");
}

export default async function AuditPage() {
  await requireRole("SUPER_ADMIN");
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { user: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Bitácora</h1>
      <p className="text-sm text-muted">Últimos 200 cambios hechos en el panel.</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="whitespace-nowrap text-sm text-muted">{formatDate(l.createdAt)}</td>
                <td className="text-sm">{l.user?.fullName ?? "—"}</td>
                <td className="text-sm">{ACTION[l.action] ?? l.action} {ENTITY[l.entity] ?? l.entity}</td>
                <td className="text-sm">{detail(l.changes)}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted">Todavía no hay cambios registrados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
