import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { deleteProduct, quickPrice, toggleProductVisible } from "@/app/actions/superadmin";
import { ProductImage } from "@/components/ProductImage";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Productos y precios" };

export default async function ProductsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  await requireRole("SUPER_ADMIN");
  const { q, cat } = await searchParams;
  const [categories, products] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { deletedAt: null, ...(cat ? { categoryId: cat } : {}), ...(q ? { name: { contains: q } } : {}) },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Productos y precios</h1>
        <Link href="/superadmin/productos/nuevo" className="btn-primary">Nuevo producto</Link>
      </div>
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre" className="input max-w-xs" aria-label="Buscar" />
        <select name="cat" defaultValue={cat ?? ""} className="input max-w-xs" aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="btn-ghost">Filtrar</button>
      </form>
      <p className="text-sm text-muted">Cambia el precio y presiona Enter: se actualiza al instante en el menú.</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Producto</th><th>Categoría</th><th>Precio (Bs)</th><th>Estado</th><th className="text-right">Acciones</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <ProductImage src={p.imageUrl} name={p.name} className="h-10 w-10 shrink-0 rounded-md text-xs" />
                    <span className="font-semibold">{p.name}</span>
                    {p.isFeatured && <span className="badge bg-accent-soft text-amber-800">Destacado</span>}
                  </div>
                </td>
                <td className="text-muted">{p.category.name}</td>
                <td>
                  <form action={quickPrice} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      name="price"
                      type="number"
                      step="0.5"
                      min="0.5"
                      defaultValue={Number(p.basePrice)}
                      className="input w-24 py-1.5 tabular-nums"
                      aria-label={`Precio de ${p.name}`}
                    />
                    <button className="btn-ghost px-2 py-1.5 text-xs">OK</button>
                  </form>
                </td>
                <td>
                  <span className={`badge ${p.isVisible ? "bg-brand-soft text-brand" : "bg-canvas text-muted"}`}>
                    {p.isVisible ? "Visible" : "Oculto"}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-2">
                    <Link href={`/superadmin/productos/${p.id}`} className="btn-ghost px-3 py-1.5 text-xs">Editar</Link>
                    <form action={toggleProductVisible}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="btn-ghost px-3 py-1.5 text-xs">{p.isVisible ? "Ocultar" : "Mostrar"}</button>
                    </form>
                    <ConfirmButton action={deleteProduct} id={p.id} label="Eliminar" question={`¿Eliminar ${p.name}?`} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-muted">No hay productos con ese filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
