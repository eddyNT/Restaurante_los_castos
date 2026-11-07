import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { toggleUserActive } from "@/app/actions/superadmin";
import { WorkerForm, ResetPasswordForm } from "./WorkerForms";

export const metadata = { title: "Trabajadores" };

export default async function UsersAdmin() {
  const session = await requireRole("SUPER_ADMIN");
  const [users, branches] = await Promise.all([
    db.user.findMany({
      where: { role: { code: { in: ["ADMIN", "SUPER_ADMIN"] } }, deletedAt: null },
      include: { role: true, branches: { include: { branch: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.branch.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Trabajadores</h1>
        <p className="text-sm text-muted">
          Un <b>Admin</b> gestiona pedidos y platos agotados de sus sucursales. Un <b>Super Admin</b> tiene acceso total.
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Rol</th><th>Sucursales</th><th>Último ingreso</th><th>Estado</th><th className="text-right">Acciones</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><p className="font-semibold">{u.fullName}</p><p className="text-sm text-muted">{u.email}</p></td>
                <td>{u.role.code === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</td>
                <td className="text-sm">{u.role.code === "SUPER_ADMIN" ? "Todas" : u.branches.map((b) => b.branch.name).join(", ")}</td>
                <td className="text-sm text-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Nunca"}</td>
                <td>
                  <span className={`badge ${u.isActive ? "bg-brand-soft text-brand" : "bg-red-50 text-red-700"}`}>
                    {u.isActive ? "Activo" : "Desactivado"}
                  </span>
                </td>
                <td>
                  {u.id === session.sub ? (
                    <p className="text-right text-xs text-muted">Tu cuenta</p>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-2">
                      <ResetPasswordForm id={u.id} />
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className={u.isActive ? "btn-danger px-3 py-1.5 text-xs" : "btn-ghost px-3 py-1.5 text-xs"}>
                          {u.isActive ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <WorkerForm branches={branches} />
    </div>
  );
}
