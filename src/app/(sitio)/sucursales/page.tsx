import { db } from "@/lib/db";
import { DAY_NAMES } from "@/lib/format";
import { openStatus } from "@/lib/hours";

export const dynamic = "force-dynamic";
export const metadata = { title: "Horarios y contacto" };

export default async function BranchesPage() {
  const branches = await db.branch.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: { hours: { orderBy: { dayOfWeek: "asc" } } },
  });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">Horarios y contacto</h1>
      <div className="grid gap-6 md:grid-cols-2">
        {branches.map((b) => {
          const status = openStatus(b.hours);
          return (
            <section key={b.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold">{b.name}</h2>
                <span className={`badge ${status.open ? "bg-brand-soft text-brand" : "bg-canvas text-muted"}`}>{status.label}</span>
              </div>
              <p className="mt-2 text-muted">{b.address}</p>
              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                {b.phone && <><dt className="text-muted">Teléfono</dt><dd>{b.phone}</dd></>}
                {b.whatsapp && <><dt className="text-muted">WhatsApp</dt><dd>{b.whatsapp}</dd></>}
                {b.email && <><dt className="text-muted">Correo</dt><dd>{b.email}</dd></>}
              </dl>
              <table className="mt-4 w-full text-sm">
                <tbody>
                  {b.hours.map((h) => (
                    <tr key={h.dayOfWeek} className="border-t border-line">
                      <td className="py-1.5">{DAY_NAMES[h.dayOfWeek]}</td>
                      <td className="py-1.5 text-right tabular-nums">{h.isClosed ? "Cerrado" : `${h.opensAt} – ${h.closesAt}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {b.mapUrl && (
                <a href={b.mapUrl} target="_blank" rel="noopener" className="btn-ghost mt-4">Ver en Google Maps</a>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
