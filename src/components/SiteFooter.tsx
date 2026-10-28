import Link from "next/link";
import { getMainBranch, getSettings } from "@/lib/settings";
import { DAY_NAMES } from "@/lib/format";

export async function SiteFooter() {
  const [settings, branch] = await Promise.all([getSettings(), getMainBranch()]);
  return (
    <footer className="mt-20 bg-brand-dark text-white/85">
      <div className="stripe h-2" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 pb-28 sm:grid-cols-3">
        <div>
          <p className="font-display text-3xl text-accent">{settings.restaurantName}</p>
          <p className="mt-1">{settings.tagline}</p>
          <Link href="/app" className="btn-accent mt-5">📲 Descargar la app</Link>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-display text-xl text-white">Horario</p>
          <ul className="space-y-1">
            {branch.hours.map((h) => (
              <li key={h.dayOfWeek} className="flex justify-between gap-4 tabular-nums">
                <span>{DAY_NAMES[h.dayOfWeek]}</span>
                <span className={h.isClosed ? "text-accent" : ""}>{h.isClosed ? "Cerrado" : `${h.opensAt} – ${h.closesAt}`}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-1 text-sm">
          <p className="mb-3 font-display text-xl text-white">Contacto</p>
          <p>📍 {branch.address}</p>
          {branch.phone && <p>📞 {branch.phone}</p>}
          {branch.whatsapp && <p>💬 WhatsApp: {branch.whatsapp}</p>}
          {branch.email && <p>✉️ {branch.email}</p>}
          <div className="flex gap-3 pt-2">
            {settings.facebookUrl && <a href={settings.facebookUrl} className="font-bold text-accent underline" target="_blank" rel="noopener">Facebook</a>}
            {settings.instagramUrl && <a href={settings.instagramUrl} className="font-bold text-accent underline" target="_blank" rel="noopener">Instagram</a>}
          </div>
        </div>
      </div>
    </footer>
  );
}
