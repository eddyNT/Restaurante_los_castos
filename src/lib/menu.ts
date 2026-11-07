import { db } from "./db";
import { toNumber } from "./format";

export type Ingredient = { name: string; removable: boolean };

/** Lee la columna JSON de ingredientes; cualquier dato mal formado se ignora. */
export function parseIngredients(json: unknown): Ingredient[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((i): i is { name: string; removable?: unknown } => typeof i?.name === "string" && i.name.trim() !== "")
    .map((i) => ({ name: i.name.trim(), removable: i.removable !== false }));
}

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
  ingredients: unknown;
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
    ingredients: parseIngredients(p.ingredients),
    price: toNumber(bp?.priceOverride?.toString() ?? p.basePrice.toString()),
    isAvailable: bp ? bp.isAvailable : true,
  };
}

export type MenuProduct = ReturnType<typeof toMenuProduct>;
