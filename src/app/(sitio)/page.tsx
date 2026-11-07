/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { getMenu } from "@/lib/menu";
import { getMainBranch, getSettings } from "@/lib/settings";
import { openStatus } from "@/lib/hours";
import { bs } from "@/lib/format";
import { InstallAppButton } from "@/components/InstallAppButton";
import { Carousel } from "@/components/Carousel";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, branch] = await Promise.all([getSettings(), getMainBranch()]);
  const menu = await getMenu(branch.id);
  const all = menu.flatMap((c) => c.products);
  const featured = all.filter((p) => p.isFeatured);
  const showcase = (featured.length >= 3 ? featured : all).filter((p) => p.imageUrl).slice(0, 3);
  const status = openStatus(branch.hours);

  return (
    <div className="space-y-16">
      {/* Portada */}
      <section className="relative -mt-2 overflow-hidden rounded-[2rem] bg-brand text-white">
        <img src="/platos/portada.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand/85 to-orange/70" />
        <div className="relative grid items-center gap-10 px-6 py-12 sm:px-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="animate-fade-up">
            <span className={`badge px-3 py-1 text-sm ${status.open ? "bg-accent text-ink" : "bg-white/20 text-white"}`}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${status.open ? "animate-pulse bg-green-600" : "bg-white/70"}`} />
              {status.label}
            </span>
            <h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl">
              {settings.restaurantName}
            </h1>
            <p className="mt-3 max-w-md text-lg font-semibold text-white/90">{settings.tagline}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/menu" className="btn-accent px-7 py-3.5 text-base">Ver el menú y pedir</Link>
              <Link href="/sucursales" className="btn border-2 border-white/40 px-6 py-3.5 text-base text-white hover:bg-white/10">
                Horarios
              </Link>
            </div>
          </div>
          <div className="relative hidden h-80 md:block" aria-hidden>
            {showcase.map((p, i) => (
              <div
                key={p.id}
                className="absolute animate-float overflow-hidden rounded-full border-[6px] border-accent shadow-2xl"
                style={{
                  width: i === 0 ? 230 : 150,
                  height: i === 0 ? 230 : 150,
                  left: i === 0 ? "18%" : i === 1 ? "0%" : "62%",
                  top: i === 0 ? "12%" : i === 1 ? "58%" : "0%",
                  animationDelay: `${i * 0.8}s`,
                }}
              >
                <img src={p.imageUrl!} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
        <div className="stripe relative h-2" />
      </section>

      {/* Favoritos */}
      {featured.length > 0 && (
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-extrabold uppercase tracking-widest text-orange">Lo que más piden</p>
              <h2 className="text-4xl">Favoritos de la casa</h2>
            </div>
            <Link href="/menu" className="shrink-0 font-extrabold text-brand hover:text-orange">Menú completo →</Link>
          </div>
          <Carousel products={featured} />
        </section>
      )}

      {/* Categorías */}
      <section>
        <h2 className="mb-5 text-4xl">¿Qué se te antoja?</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {menu.map((c) => {
            const img = c.products.find((p) => p.imageUrl)?.imageUrl;
            const from = Math.min(...c.products.map((p) => p.price));
            return (
              <Link
                key={c.id}
                href={`/menu#${c.slug}`}
                className="group relative aspect-square overflow-hidden rounded-3xl bg-orange shadow-sm"
              >
                {img && <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="font-display text-2xl leading-none">{c.name}</p>
                  <p className="text-sm font-bold text-accent">desde {bs(from)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Cómo pedir: es una secuencia real */}
      <section className="grid gap-4 rounded-[2rem] bg-accent-soft p-6 sm:grid-cols-3 sm:p-10">
        {[
          ["Elige", "Arma tu pedido desde el menú, para recoger o con delivery."],
          ["Paga", "En efectivo o con el QR de nuestro banco, sin comisiones."],
          ["Disfruta", "Sigue el estado de tu pedido en vivo hasta que llegue."],
        ].map(([title, text], i) => (
          <div key={title} className="flex gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand font-display text-2xl text-white">{i + 1}</span>
            <div>
              <p className="font-display text-2xl">{title}</p>
              <p className="text-muted">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {/* App */}
      <section className="relative overflow-hidden rounded-[2rem] bg-orange px-6 py-10 text-white sm:px-12">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/40" aria-hidden />
        <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-brand/40" aria-hidden />
        <div className="relative max-w-xl">
          <h2 className="text-4xl">Pide más rápido desde tu celular</h2>
          <p className="mb-6 mt-2 text-lg font-semibold text-white/90">Instala nuestra app en segundos, sin pasar por la tienda.</p>
          <InstallAppButton androidUrl={settings.androidAppUrl} iosUrl={settings.iosAppUrl} />
        </div>
      </section>
    </div>
  );
}
