/* eslint-disable @next/next/no-img-element */
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { activatePaymentQr, deactivatePaymentQr, deletePaymentQr } from "@/app/actions/superadmin";
import { ConfirmButton } from "@/components/ConfirmButton";
import { QrUploadForm } from "./QrUploadForm";

export const metadata = { title: "QR de pago" };

export default async function PaymentQrAdmin() {
  await requireRole("SUPER_ADMIN");
  const branches = await db.branch.findMany({
    orderBy: { createdAt: "asc" },
    include: { paymentQrs: { orderBy: { createdAt: "desc" }, include: { uploader: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">QR de pago</h1>
        <p className="max-w-2xl text-sm text-muted">
          Sube la imagen del QR que genera la app de tu banco. El QR activo es el que ve el cliente al pagar; cada sucursal tiene uno activo.
          Puedes guardar varios y cambiar de banco cuando quieras.
        </p>
      </div>
      <QrUploadForm branches={branches.map((b) => ({ id: b.id, name: b.name }))} />
      {branches.map((b) => (
        <section key={b.id} className="space-y-3">
          {branches.length > 1 && <h2 className="text-lg font-extrabold">{b.name}</h2>}
          {b.paymentQrs.length === 0 && <p className="text-sm text-muted">Esta sucursal todavía no tiene QR. Los clientes solo podrán pagar en efectivo.</p>}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {b.paymentQrs.map((q) => (
              <article key={q.id} className={`card p-4 ${q.isActive ? "border-brand ring-2 ring-brand/20" : ""}`}>
                <img src={q.imageUrl} alt={`QR ${q.bankName}`} className="mx-auto aspect-square w-full max-w-[220px] rounded-lg border border-line object-contain" />
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{q.bankName}</p>
                    <p className="text-sm text-muted">{q.accountHolder}</p>
                  </div>
                  {q.isActive ? (
                    <span className="badge bg-brand text-white">Activo</span>
                  ) : (
                    <span className="badge bg-canvas text-muted">Inactivo</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">Subido por {q.uploader.fullName} · {formatDate(q.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.isActive ? (
                    <form action={deactivatePaymentQr}>
                      <input type="hidden" name="id" value={q.id} />
                      <button className="btn-ghost px-3 py-1.5 text-xs">Desactivar</button>
                    </form>
                  ) : (
                    <form action={activatePaymentQr}>
                      <input type="hidden" name="id" value={q.id} />
                      <button className="btn-primary px-3 py-1.5 text-xs">Usar este QR</button>
                    </form>
                  )}
                  <ConfirmButton action={deletePaymentQr} id={q.id} label="Eliminar" question="¿Eliminar este QR?" />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
