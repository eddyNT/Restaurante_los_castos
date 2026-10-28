import { requireRole } from "@/lib/auth";
import { getMainBranch } from "@/lib/settings";
import { getMenu } from "@/lib/menu";
import { bs } from "@/lib/format";
import { setAvailability } from "@/app/actions/staff";

export const metadata = { title: "Platos agotados" };

export default async function AvailabilityPage() {
  await requireRole("ADMIN");
  const branch = await getMainBranch();
  const menu = await getMenu(branch.id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold">Platos agotados</h1>
      <p className="mb-6 text-sm text-muted">Marca lo que se terminó hoy. El cliente lo verá como «Agotado hoy» y no podrá pedirlo.</p>
      <div className="space-y-6">
        {menu.map((c) => (
          <section key={c.id}>
            <h2 className="mb-2 font-display font-semibold">{c.name}</h2>
            <ul className="card divide-y divide-line">
              {c.products.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className={p.isAvailable ? "" : "text-muted line-through"}>{p.name}</p>
                    <p className="text-xs text-muted tabular-nums">{bs(p.price)}</p>
                  </div>
                  <form action={setAvailability}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="branchId" value={branch.id} />
                    <input type="hidden" name="available" value={p.isAvailable ? "0" : "1"} />
                    <button className={p.isAvailable ? "btn-ghost" : "btn-primary"}>
                      {p.isAvailable ? "Marcar agotado" : "Volver a ofrecer"}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
