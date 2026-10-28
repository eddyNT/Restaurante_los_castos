import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { BranchForm, SettingsForm } from "./ConfigForms";

export const metadata = { title: "Local y horarios" };

export default async function ConfigPage() {
  await requireRole("SUPER_ADMIN");
  const [settings, branches] = await Promise.all([
    getSettings(),
    db.branch.findMany({ orderBy: { createdAt: "asc" }, include: { hours: { orderBy: { dayOfWeek: "asc" } } } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold">Local y horarios</h1>
      <SettingsForm settings={settings} />
      {branches.map((b) => (
        <BranchForm
          key={b.id}
          branch={{
            id: b.id,
            name: b.name,
            address: b.address,
            phone: b.phone ?? "",
            whatsapp: b.whatsapp ?? "",
            email: b.email ?? "",
            mapUrl: b.mapUrl ?? "",
            hours: b.hours.map((h) => ({ dayOfWeek: h.dayOfWeek, opensAt: h.opensAt, closesAt: h.closesAt, isClosed: h.isClosed })),
          }}
        />
      ))}
    </div>
  );
}
