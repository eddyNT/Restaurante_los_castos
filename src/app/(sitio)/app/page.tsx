import { getSettings } from "@/lib/settings";
import { InstallAppButton } from "@/components/InstallAppButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Descargar la app" };

export default async function AppPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-brand px-6 py-10 text-white sm:px-10">
      <h1 className="text-4xl font-extrabold">Lleva {s.restaurantName} en tu celular</h1>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-white/85">
        <li>Abre el menú con un toque desde tu pantalla de inicio.</li>
        <li>Revisa el estado de tu pedido al momento.</li>
        <li>Tu carrito y tus datos quedan guardados.</li>
      </ul>
      <div className="mt-6">
        <InstallAppButton androidUrl={s.androidAppUrl} iosUrl={s.iosAppUrl} />
      </div>
    </div>
  );
}
