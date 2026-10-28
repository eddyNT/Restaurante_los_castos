"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Group = { title: string; links: { href: string; label: string }[] };

export function PanelNav({ groups }: { groups: Group[] }) {
  const path = usePathname();
  const isActive = (href: string) => {
    if (href === "/admin") return path === "/admin" || path.startsWith("/admin/pedidos");
    if (href === "/superadmin") return path === "/superadmin";
    return path.startsWith(href);
  };

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:block md:space-y-4 md:pb-0">
      {groups.map((g) => (
        <div key={g.title} className="flex gap-1 md:block md:space-y-0.5">
          <p className="hidden px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-white/50 md:block">{g.title}</p>
          {g.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block shrink-0 rounded-md px-3 py-2 text-sm ${isActive(l.href) ? "bg-white/15 font-semibold text-white" : "text-white/75 hover:bg-white/10"}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
