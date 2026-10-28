import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Editar producto" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("SUPER_ADMIN");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findFirst({ where: { id, deletedAt: null } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!product) notFound();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Editar: {product.name}</h1>
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          basePrice: Number(product.basePrice),
          imageUrl: product.imageUrl,
          isVisible: product.isVisible,
          isFeatured: product.isFeatured,
        }}
      />
    </div>
  );
}
