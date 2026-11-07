import { cache } from "react";
import { db } from "./db";

export const DEFAULT_SETTINGS = {
  restaurantName: "Mi Restaurante",
  tagline: "Comida casera hecha al momento",
  deliveryFee: "10",
  prepMinutes: "20",
  facebookUrl: "",
  instagramUrl: "",
  androidAppUrl: "",
  iosAppUrl: "",
};

export type Settings = typeof DEFAULT_SETTINGS;

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.setting.findMany();
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in s) s[r.key as keyof Settings] = r.value;
  return s;
});

/** Sucursal principal. En el piloto hay una sola; con varias se agregará un selector. */
export const getMainBranch = cache(async () => {
  return db.branch.findFirstOrThrow({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: { hours: { orderBy: { dayOfWeek: "asc" } } },
  });
});
