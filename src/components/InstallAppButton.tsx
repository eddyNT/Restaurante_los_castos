"use client";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallAppButton({ androidUrl, iosUrl }: { androidUrl?: string; iosUrl?: string }) {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", () => setInstalled(true));
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return setHelp(true);
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {installed ? (
          <span className="btn-ghost">App instalada ✓</span>
        ) : (
          <button type="button" onClick={install} className="btn-accent">
            Descargar la app
          </button>
        )}
        {androidUrl && <a href={androidUrl} className="btn-ghost" target="_blank" rel="noopener">Google Play</a>}
        {iosUrl && <a href={iosUrl} className="btn-ghost" target="_blank" rel="noopener">App Store</a>}
      </div>
      {help && (
        <p className="max-w-md text-sm opacity-90">
          En Android (Chrome): menú ⋮ → <b>Instalar aplicación</b>. En iPhone (Safari): botón Compartir → <b>Agregar a pantalla de inicio</b>.
        </p>
      )}
    </div>
  );
}
