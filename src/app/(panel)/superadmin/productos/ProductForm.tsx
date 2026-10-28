"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveProduct } from "@/app/actions/superadmin";
import { SubmitButton } from "@/components/SubmitButton";
import { ProductImage } from "@/components/ProductImage";

type Product = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  basePrice: number;
  imageUrl: string | null;
  isVisible: boolean;
  isFeatured: boolean;
};

export function ProductForm({ product, categories }: { product?: Product; categories: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveProduct, undefined);
  return (
    <form action={action} className="card grid max-w-3xl gap-4 p-6 md:grid-cols-2">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div className="md:col-span-2">
        <label className="label" htmlFor="name">Nombre</label>
        <input id="name" name="name" className="input" required defaultValue={product?.name} />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="description">Descripción</label>
        <textarea id="description" name="description" rows={3} className="input" defaultValue={product?.description ?? ""} />
      </div>
      <div>
        <label className="label" htmlFor="categoryId">Categoría</label>
        <select id="categoryId" name="categoryId" className="input" required defaultValue={product?.categoryId}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="basePrice">Precio (Bs)</label>
        <input id="basePrice" name="basePrice" type="number" step="0.5" min="0.5" className="input" required defaultValue={product?.basePrice} />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="image">Foto (JPG, PNG o WEBP, máx. 3 MB)</label>
        <div className="flex items-center gap-4">
          {product && <ProductImage src={product.imageUrl} name={product.name} className="h-16 w-16 shrink-0 rounded-lg text-sm" />}
          <input id="image" name="image" type="file" accept="image/png,image/jpeg,image/webp" className="input" />
        </div>
        {product?.imageUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" name="removeImage" /> Quitar la foto actual
          </label>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isVisible" defaultChecked={product?.isVisible ?? true} /> Visible en el menú
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured ?? false} /> Destacado en el inicio
      </label>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">{state.error}</p>}
      <div className="flex gap-2 md:col-span-2">
        <SubmitButton>{product ? "Guardar cambios" : "Crear producto"}</SubmitButton>
        <Link href="/superadmin/productos" className="btn-ghost">Cancelar</Link>
      </div>
    </form>
  );
}
