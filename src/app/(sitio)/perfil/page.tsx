import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { deleteAddress } from "@/app/actions/customer";
import { ProfileForms } from "./ProfileForms";

export const metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const session = await requireRole("CUSTOMER", "ADMIN");
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.sub },
    include: { addresses: { orderBy: { createdAt: "asc" } }, _count: { select: { orders: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Mi perfil</h1>
        <p className="text-muted">
          {user.email} · {user._count.orders} pedidos
        </p>
      </div>
      <ProfileForms fullName={user.fullName} phone={user.phone ?? ""} />
      <section className="card p-5">
        <h2 className="mb-3 text-lg font-extrabold">Direcciones guardadas</h2>
        {user.addresses.length === 0 && <p className="text-sm text-muted">Aún no guardaste direcciones.</p>}
        <ul className="divide-y divide-line">
          {user.addresses.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="font-semibold">{a.label}</p>
                <p className="text-sm text-muted">{a.line}{a.reference ? ` · ${a.reference}` : ""}</p>
              </div>
              <form action={deleteAddress}>
                <input type="hidden" name="id" value={a.id} />
                <button className="text-sm text-red-700 hover:underline">Eliminar</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
