/* eslint-disable @next/next/no-img-element */
import { headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { branchScope, requireRole } from "@/lib/auth";
import { addTable, deleteTable, setTableStatus } from "@/app/actions/staff";

export const metadata = { title: "Mesas" };

const STATUS = {
  FREE: { label: "Libre", tone: "bg-brand-soft text-brand" },
  OCCUPIED: { label: "Ocupada", tone: "bg-accent-soft text-amber-800" },
  RESERVED: { label: "Reservada", tone: "bg-sky-50 text-sky-800" },
} as const;

export default async function TablesPage({ searchParams }: { searchParams: Promise<{ qr?: string }> }) {
  const session = await requireRole("ADMIN");
  const { qr } = await searchParams;
  const isSuper = session.role === "SUPER_ADMIN";
  const branches = await db.branch.findMany({
    where: isSuper ? {} : { id: { in: session.branchIds } },
    include: { tables: { where: branchScope(session), orderBy: { number: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const qrTable = qr ? branches.flatMap((b) => b.tables).find((t) => t.id === qr) : undefined;
  const qrDataUrl = qrTable ? await QRCode.toDataURL(`${origin}/m/${qrTable.qrToken}`, { width: 360, margin: 1 }) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Mesas</h1>
        <p className="text-sm text-muted">Cada mesa tiene un QR propio: el cliente lo escanea y pide sin registrarse.</p>
      </div>
      {branches.map((b) => (
        <section key={b.id} className="space-y-3">
          {branches.length > 1 && <h2 className="text-lg font-extrabold">{b.name}</h2>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {b.tables.map((t) => {
              const url = `${origin}/m/${t.qrToken}`;
              const showQr = qr === t.id;
              const dataUrl = showQr ? qrDataUrl : null;
              return (
                <article key={t.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-xl font-extrabold">Mesa {t.number}</p>
                    <span className={`badge ${STATUS[t.status].tone}`}>{STATUS[t.status].label}</span>
                  </div>
                  <p className="text-sm text-muted">{t.capacity} personas</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(Object.keys(STATUS) as (keyof typeof STATUS)[]).filter((s) => s !== t.status).map((s) => (
                      <form key={s} action={setTableStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value={s} />
                        <button className="btn-ghost px-2.5 py-1 text-xs">{STATUS[s].label}</button>
                      </form>
                    ))}
                  </div>
                  {isSuper && (
                    <div className="mt-3 border-t border-line pt-3 text-sm">
                      {showQr && dataUrl ? (
                        <div className="text-center">
                          <img src={dataUrl} alt={`QR de la mesa ${t.number}`} className="mx-auto w-44" />
                          <p className="font-semibold">Mesa {t.number}</p>
                          <p className="break-all text-xs text-muted">{url}</p>
                          <p className="mt-1 text-xs text-muted">Clic derecho → Guardar imagen para imprimirla.</p>
                        </div>
                      ) : (
                        <a href={`?qr=${t.id}`} className="font-semibold text-brand">Ver QR para imprimir</a>
                      )}
                      <form action={deleteTable} className="mt-2">
                        <input type="hidden" name="id" value={t.id} />
                        <button className="text-xs text-red-700 hover:underline">Eliminar mesa o renovar su QR</button>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          {isSuper && (
            <form action={addTable} className="card flex flex-wrap items-end gap-3 p-4">
              <input type="hidden" name="branchId" value={b.id} />
              <div>
                <label className="label" htmlFor={`num-${b.id}`}>Número de mesa</label>
                <input id={`num-${b.id}`} name="number" className="input w-32" required />
              </div>
              <div>
                <label className="label" htmlFor={`cap-${b.id}`}>Capacidad</label>
                <input id={`cap-${b.id}`} name="capacity" type="number" min={1} defaultValue={4} className="input w-24" />
              </div>
              <button className="btn-primary">Agregar mesa</button>
            </form>
          )}
        </section>
      ))}
    </div>
  );
}
