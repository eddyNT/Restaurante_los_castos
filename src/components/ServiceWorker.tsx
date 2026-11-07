"use client";
import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else {
      // En desarrollo se quita el que haya quedado de una prueba en producción: si no, con el servidor
      // apagado el navegador muestra «Sin conexión» en vez del error real.
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
    }
  }, []);
  return null;
}
