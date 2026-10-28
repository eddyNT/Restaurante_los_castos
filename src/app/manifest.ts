export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: s.restaurantName,
    short_name: s.restaurantName.slice(0, 12),
    description: s.tagline,
    start_url: "/menu",
    display: "standalone",
    background_color: "#fff8ee",
    theme_color: "#d62828",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
