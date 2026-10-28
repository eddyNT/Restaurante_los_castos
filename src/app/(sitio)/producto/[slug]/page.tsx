import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bs } from "@/lib/format";
import { toMenuProduct } from "@/lib/menu";
import { getMainBranch } from "@/lib/settings";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const branch = await getMainBranch();
  const p = await db.product.findFirst({
    where: { slug, isVisible: true, deletedAt: null },
    include: {
      category: { include: { products: { where: { isVisible: true, deletedAt: null, slug: { not: slug } }, take: 3, include: { branchProducts: { where: { branchId: branch.id } } } } } },
      branchProducts: { where: { branchId: branch.id } },
    },
  });
  if (!p) notFound();
  const product = toMenuProduct(p);
  const related = p.category.products.map((r) => toMenuProduct(r));

  return (
    <div className="space-y-14">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="relative">
          <div className="absolute -inset-3 rotate-2 rounded-[2rem] bg-accent" aria-hidden />
          <ProductImage src={product.imageUrl} name={product.name} className="relative aspect-[4/3] w-full rounded-[2rem] shadow-xl" />
        </div>
        <div>
          <Link href={`/menu#${p.category.slug}`} className="font-extrabold text-orange hover:text-brand">← {p.category.name}</Link>
          <h1 className="mt-2 text-5xl leading-none">{product.name}</h1>
          <p className="mt-4 inline-block rounded-full bg-brand px-4 py-1.5 font-display text-3xl text-white">{bs(product.price)}</p>
          {product.description && <p className="mt-5 text-lg text-muted">{product.description}</p>}
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <section>
          <h2 className="mb-5 text-3xl">También te puede gustar</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
