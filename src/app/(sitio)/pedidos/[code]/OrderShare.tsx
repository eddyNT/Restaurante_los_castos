"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

/** QR con los datos del pedido y botones para enviarlo al WhatsApp del local, descargarlo o compartirlo. */
export function OrderShare({ code, qrDataUrl, whatsappUrl, whatsappNumber }: {
  code: string;
  qrDataUrl: string;
  whatsappUrl: string | null;
  whatsappNumber: string | null;
}) {
  const [canShareFile, setCanShareFile] = useState(false);
  useEffect(() => {
    const probe = new File([""], "x.png", { type: "image/png" });
    setCanShareFile(typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }));
  }, []);

  async function shareImage() {
    const blob = await (await fetch(qrDataUrl)).blob();
    const file = new File([blob], `pedido-${code}.png`, { type: "image/png" });
    try {
      await navigator.share({ files: [file], title: `Pedido ${code}` });
    } catch {
      // el cliente cerró el menú de compartir
    }
  }

  return (
    <section className="card grid gap-6 p-6 sm:grid-cols-[200px_1fr]">
      <div className="text-center">
        <img src={qrDataUrl} alt={`QR del pedido ${code}`} className="mx-auto w-full max-w-[200px] rounded-lg border border-line" />
        <p className="mt-1 font-semibold">{code}</p>
      </div>
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-extrabold">Tu QR del pedido</h2>
          <p className="text-sm text-muted">
            Tiene tus datos y el detalle del pedido. Envíalo al restaurante{whatsappNumber ? ` (${whatsappNumber})` : ""} o muéstralo al llegar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener" className="btn-primary bg-[#25D366] hover:bg-[#1da851]">
              Enviar por WhatsApp
            </a>
          )}
          {canShareFile && (
            <button type="button" onClick={shareImage} className="btn-ghost">Compartir imagen del QR</button>
          )}
          <a href={qrDataUrl} download={`pedido-${code}.png`} className="btn-ghost">Descargar QR</a>
        </div>
        {whatsappUrl && (
          <p className="text-xs text-muted">
            «Enviar por WhatsApp» abre el chat con el mensaje del pedido listo. Para mandar también la imagen del QR, descárgala o usa «Compartir» y adjúntala en el chat.
          </p>
        )}
      </div>
    </section>
  );
}
