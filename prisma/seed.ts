import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync } from "fs";

const db = new PrismaClient();

// Ingredientes: [nombre, se puede quitar]. Lo principal del plato no se puede quitar.
type Item = [name: string, description: string, price: number, featured?: boolean, ingredients?: [string, boolean][]];

const MENU: Record<string, Item[]> = {
  "Platos típicos": [
    ["Pollo a la broaster", "Pollo crocante a la broaster con arroz y papas fritas.", 15, true, [["Pollo", false], ["Arroz", true], ["Papas fritas", true]]],
    ["Pollo al espiedo", "Pollo dorado al espiedo con arroz, papa y fideo.", 16, true, [["Pollo", false], ["Arroz", true], ["Papa", true], ["Fideo", true]]],
    ["Silpancho", "Carne apanada sobre arroz y papa, con huevo frito y ensalada.", 16, true, [["Carne apanada", false], ["Arroz", true], ["Papa", true], ["Huevo", true], ["Ensalada", true]]],
    ["Asadito", "Carne de res asada con arroz, huevo y ensalada.", 15, true, [["Carne de res", false], ["Arroz", true], ["Huevo", true], ["Ensalada", true]]],
  ],
  Bebidas: [
    ["Mocochinchi", "Refresco tradicional de durazno deshidratado. Vaso de 500 ml.", 8],
    ["Jugo de tumbo", "Jugo natural. Vaso de 500 ml.", 12],
    ["Gaseosa 2 L", "Coca-Cola, Fanta o Sprite.", 18],
    ["Agua sin gas 600 ml", "Agua embotellada.", 6],
  ],
};

const slug = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const roles = await Promise.all(
    [
      ["SUPER_ADMIN", "Super Administrador"],
      ["ADMIN", "Administrador / Trabajador"],
      ["CUSTOMER", "Cliente"],
    ].map(([code, name]) => db.role.upsert({ where: { code }, update: { name }, create: { code, name } })),
  );
  const role = Object.fromEntries(roles.map((r) => [r.code, r.id]));

  const branch = await db.branch.upsert({
    where: { slug: "casa-matriz" },
    update: {},
    create: {
      name: "Casa matriz",
      slug: "casa-matriz",
      address: "Av. Principal #123, zona centro",
      phone: "+591 3 3000000",
      whatsapp: "+591 68543387",
      email: "contacto@mirestaurante.bo",
    },
  });

  for (let d = 0; d < 7; d++) {
    await db.branchHour.upsert({
      where: { branchId_dayOfWeek: { branchId: branch.id, dayOfWeek: d } },
      update: {},
      create: { branchId: branch.id, dayOfWeek: d, opensAt: d === 0 ? "10:00" : "11:00", closesAt: "22:00", isClosed: d === 1 },
    });
  }

  const users = [
    { email: "superadmin@restaurante.local", password: "Admin123!", fullName: "Dueño del restaurante", role: "SUPER_ADMIN" },
    { email: "trabajador@restaurante.local", password: "Trabajo123!", fullName: "Cajero de turno", role: "ADMIN" },
    { email: "cliente@demo.com", password: "Cliente123!", fullName: "Cliente de prueba", role: "CUSTOMER", phone: "70011122" },
  ];
  for (const u of users) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        fullName: u.fullName,
        phone: u.phone,
        roleId: role[u.role],
      },
    });
    if (u.role !== "CUSTOMER") {
      await db.userBranch.upsert({
        where: { userId_branchId: { userId: user.id, branchId: branch.id } },
        update: {},
        create: { userId: user.id, branchId: branch.id },
      });
    }
  }

  let order = 0;
  for (const [catName, items] of Object.entries(MENU)) {
    const cat = await db.category.upsert({
      where: { slug: slug(catName) },
      update: {},
      create: { name: catName, slug: slug(catName), sortOrder: order++ },
    });
    for (const [name, description, price, featured, ingredients = []] of items) {
      // Foto de referencia en public/platos/<slug>.webp (solo si el producto aún no tiene foto)
      const photo = existsSync(`public/platos/${slug(name)}.webp`) ? `/platos/${slug(name)}.webp` : null;
      const product = await db.product.upsert({
        where: { slug: slug(name) },
        update: {},
        create: {
          name,
          slug: slug(name),
          description,
          basePrice: price,
          isFeatured: !!featured,
          categoryId: cat.id,
          imageUrl: photo,
          ingredients: ingredients.map(([n, removable]) => ({ name: n, removable })),
        },
      });
      if (!product.imageUrl && photo) await db.product.update({ where: { id: product.id }, data: { imageUrl: photo } });
    }
  }

  console.log("Datos de ejemplo cargados.");
}

main().finally(() => db.$disconnect());
