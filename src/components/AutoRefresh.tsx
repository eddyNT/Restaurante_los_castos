"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Vuelve a pedir los datos del servidor cada cierto tiempo (reemplazable por WebSockets en el hosting). */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
