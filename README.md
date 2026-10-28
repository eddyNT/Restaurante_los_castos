# Sistema Web Restaurante

Pedidos en línea, panel de trabajadores y administración total para un restaurante. Arranca con un local y está preparado para varias sucursales.

**Stack:** Next.js 15 + TypeScript + Tailwind · Prisma · MariaDB/MySQL (local) o PostgreSQL (hosting).

## Probar en tu PC (localhost)

Requisitos: Node.js 20 o superior y XAMPP (MySQL/MariaDB).

1. Abre el **XAMPP Control Panel** y presiona **Start** en MySQL.
2. En una terminal, dentro de esta carpeta:

   ```bash
   npm install
   npx prisma migrate dev     # crea la base "restaurante" y sus tablas
   npm run db:seed            # carga menú, mesas y usuarios de ejemplo
   npm run dev                # http://localhost:3000
   ```

3. Cuentas de prueba:

   | Rol | Correo | Contraseña |
   |---|---|---|
   | Super Admin | superadmin@restaurante.local | Admin123! |
   | Admin / Trabajador | trabajador@restaurante.local | Trabajo123! |
   | Cliente | cliente@demo.com | Cliente123! |

   Cambia estas contraseñas antes de publicar el sistema.

Para ver las tablas: phpMyAdmin (http://localhost/phpmyadmin) o `npm run db:studio`.

### Probar desde el celular en la misma red Wi-Fi

`npm run dev -- -H 0.0.0.0` y abre `http://IP-DE-TU-PC:3000` en el celular (la IP sale con `ipconfig`). Así se prueban los QR de mesa. El botón «Descargar app» (instalar como PWA) necesita HTTPS, así que funciona en `localhost` o ya en el hosting.

## Qué hace cada rol

- **Cliente** (`/`, `/menu`, `/carrito`, `/checkout`, `/pedidos`, `/perfil`): menú por categorías, carrito, pedido para recoger o delivery, pago en efectivo o por QR con subida de comprobante y seguimiento del pedido.
- **Invitado en mesa** (`/m/<token>`): escanea el QR de la mesa y pide sin registrarse.
- **Admin** (`/admin`): tablero de pedidos que se actualiza solo y suena con cada pedido nuevo, verificación de pagos QR, estado de mesas y platos agotados.
- **Super Admin** (`/superadmin`): ventas, productos y precios, categorías, clientes con exportación a CSV, trabajadores, **QR de pago**, datos del local y horarios, y bitácora de cambios.

## Pasar a un hosting

Opción recomendada: **Vercel + Neon (PostgreSQL) + Cloudinary**.

1. En `prisma/schema.prisma`, cambia `provider = "mysql"` por `provider = "postgresql"`, borra la carpeta `prisma/migrations` y genera la migración inicial contra la base nueva (`npx prisma migrate dev --name init`).
2. Las imágenes se guardan hoy en la carpeta `uploads/`, que **no persiste en Vercel**. Antes de publicar, cambia `src/lib/upload.ts` para subir a Cloudinary o Cloudflare R2. Solo hay que cambiar ese archivo.
3. Variables de entorno en el hosting: `DATABASE_URL` y `AUTH_SECRET` (una clave nueva y larga).
4. Ejecuta `npx prisma migrate deploy` y `npm run db:seed` una vez contra la base de producción.

Alternativa sin cambiar código: un **VPS** (por ejemplo Hostinger o DigitalOcean) con Node, MySQL y PM2. Ahí la carpeta `uploads/` sí persiste. Pon Nginx con HTTPS delante.

## Sucursales

Todas las tablas operativas ya tienen `branchId`. Hoy el sitio usa la primera sucursal activa (`getMainBranch` en `src/lib/settings.ts`). Para abrir otra sucursal: crea el registro, asígnale trabajadores y agrega un selector de sucursal en el checkout.
