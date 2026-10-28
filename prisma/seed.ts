import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { existsSync } from "fs";

const db = new PrismaClient();

const MENU: Record<string, [string, string, number, boolean?][]> = {
  "Platos típicos": [
    ["Silpancho", "Carne apanada sobre arroz y papa, con huevo frito y ensalada de tomate y cebolla.", 35, true],
    ["Pique macho", "Carne de res, salchicha, papas fritas, locoto, cebolla y huevo. Para compartir.", 65, true],
    ["Majadito", "Arroz con charque, plátano frito y huevo.", 30],
    ["Chicharrón de cerdo", "Cerdo dorado en su jugo con mote y llajua.", 45],
  ],
  Sopas: [
    ["Sopa de maní", "Sopa cremosa de maní con papas fritas y perejil.", 18, true],
    ["Chairo", "Sopa paceña de chuño, carne y verduras.", 20],
  ],
  Parrilla: [
    ["Churrasco", "300 g de carne a la parrilla con arroz, papa y ensalada.", 55],
    ["Pollo a la parrilla", "Medio pollo marinado con guarniciones.", 42],
  ],
  Bebidas: [
    ["Mocochinchi", "Refresco tradicional de durazno deshidratado. Vaso de 500 ml.", 8],
    ["Jugo de tumbo", "Jugo natural. Vaso de 500 ml.", 12],
    ["Gaseosa 2 L", "Coca-Cola, Fanta o Sprite.", 18],
    ["Agua sin gas 600 ml", "Agua embotellada.", 6],
  ],
  Postres: [
    ["Helado de canela", "Clásico helado de canela, dos bolas.", 10],
    ["Flan casero", "Flan de leche con caramelo.", 12],
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
      whatsapp: "+591 70000000",
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
    for (const [name, description, price, featured] of items) {
      // Foto de referencia en public/platos/<slug>.webp (solo si el producto aún no tiene foto)
      const photo = existsSync(`public/platos/${slug(name)}.webp`) ? `/platos/${slug(name)}.webp` : null;
      const product = await db.product.upsert({
        where: { slug: slug(name) },
        update: {},
        create: { name, slug: slug(name), description, basePrice: price, isFeatured: !!featured, categoryId: cat.id, imageUrl: photo },
      });
      if (!product.imageUrl && photo) await db.product.update({ where: { id: product.id }, data: { imageUrl: photo } });
    }
  }

  for (let n = 1; n <= 6; n++) {
    await db.diningTable.upsert({
      where: { branchId_number: { branchId: branch.id, number: String(n) } },
      update: {},
      create: { branchId: branch.id, number: String(n), capacity: n <= 4 ? 4 : 6, qrToken: randomBytes(8).toString("hex") },
    });
  }

  console.log("Datos de ejemplo cargados.");
}

main().finally(() => db.$disconnect());
