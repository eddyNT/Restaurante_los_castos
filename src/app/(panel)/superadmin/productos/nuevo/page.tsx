import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Nuevo producto" };

export default async function NewProduct() {
  await requireRole("SUPER_ADMIN");
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Nuevo producto</h1>
      {categories.length === 0 ? (
        <p>
          Primero crea una categoría en <Link href="/superadmin/categorias" className="font-semibold text-brand">Categorías</Link>.
        </p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
