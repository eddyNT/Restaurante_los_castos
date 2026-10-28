import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { deleteCategory, saveCategory } from "@/app/actions/superadmin";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Categorías" };

export default async function CategoriesAdmin() {
  await requireRole("SUPER_ADMIN");
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { deletedAt: null } } } } },
  });

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold">Categorías</h1>
      <p className="text-sm text-muted">El orden define cómo aparecen en el menú (menor número primero).</p>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Orden</th><th>Visible</th><th>Productos</th><th></th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td colSpan={4} className="p-0">
                  <form action={saveCategory} className="grid grid-cols-[1fr_80px_70px_80px_auto] items-center gap-3 px-4 py-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input name="name" defaultValue={c.name} className="input py-1.5" aria-label="Nombre" required />
                    <input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input py-1.5" aria-label="Orden" />
                    <input name="isVisible" type="checkbox" defaultChecked={c.isVisible} aria-label="Visible" />
                    <span className="text-muted tabular-nums">{c._count.products}</span>
                    <button className="btn-ghost px-3 py-1.5 text-xs">Guardar</button>
                  </form>
                </td>
                <td className="text-right">
                  {c._count.products === 0 ? (
                    <ConfirmButton action={deleteCategory} id={c.id} label="Eliminar" question="¿Eliminar?" />
                  ) : (
                    <span className="text-xs text-muted">Tiene productos</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={saveCategory} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="flex-1">
          <label className="label" htmlFor="new-name">Nueva categoría</label>
          <input id="new-name" name="name" className="input" required placeholder="Ej.: Desayunos" />
        </div>
        <div>
          <label className="label" htmlFor="new-order">Orden</label>
          <input id="new-order" name="sortOrder" type="number" defaultValue={categories.length} className="input w-24" />
        </div>
        <input type="hidden" name="isVisible" value="on" />
        <button className="btn-primary">Agregar</button>
      </form>
    </div>
  );
}
