import { db } from "./db";
import { toNumber } from "./format";

/** Productos visibles con su precio efectivo y disponibilidad en una sucursal. */
export async function getMenu(branchId: string) {
  const categories = await db.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isVisible: true, deletedAt: null },
        orderBy: { name: "asc" },
        include: { branchProducts: { where: { branchId } } },
      },
    },
  });
  return categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      products: c.products.map((p) => toMenuProduct(p)),
    }))
    .filter((c) => c.products.length > 0);
}

type ProductWithBranch = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: { toString(): string };
  isFeatured: boolean;
  branchProducts: { priceOverride: { toString(): string } | null; isAvailable: boolean }[];
};

export function toMenuProduct(p: ProductWithBranch) {
  const bp = p.branchProducts[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    imageUrl: p.imageUrl,
    isFeatured: p.isFeatured,
    price: toNumber(bp?.priceOverride?.toString() ?? p.basePrice.toString()),
    isAvailable: bp ? bp.isAvailable : true,
  };
}

export type MenuProduct = ReturnType<typeof toMenuProduct>;
