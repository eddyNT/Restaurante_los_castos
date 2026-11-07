import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getMainBranch, getSettings } from "@/lib/settings";
import { openStatus, pickupSlots } from "@/lib/hours";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirmar pedido" };

export default async function CheckoutPage() {
  const [session, settings, branch] = await Promise.all([getSession(), getSettings(), getMainBranch()]);
  const user = session
    ? await db.user.findUnique({ where: { id: session.sub }, include: { addresses: true } })
    : null;
  const qrAvailable = (await db.paymentQr.count({ where: { branchId: branch.id, isActive: true } })) > 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-extrabold">Confirmar pedido</h1>
      <CheckoutForm
        loggedIn={!!user}
        defaultName={user?.fullName ?? ""}
        defaultPhone={user?.phone ?? ""}
        addresses={user?.addresses.map((a) => ({ id: a.id, label: a.label, line: a.line, reference: a.reference })) ?? []}
        deliveryFee={Number(settings.deliveryFee) || 0}
        qrAvailable={qrAvailable}
        status={openStatus(branch.hours)}
        slotDay={pickupSlots(branch.hours, Number(settings.prepMinutes) || 0)}
      />
    </div>
  );
}
