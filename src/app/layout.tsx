import type { Metadata, Viewport } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const lilita = Lilita_One({ subsets: ["latin"], variable: "--font-lilita", weight: "400" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito", weight: ["400", "600", "700", "800"] });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.restaurantName, template: `%s · ${s.restaurantName}` },
    description: s.tagline,
    applicationName: s.restaurantName,
    appleWebApp: { capable: true, title: s.restaurantName, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = { themeColor: "#d62828" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lilita.variable} ${nunito.variable}`}>
      <body className="antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
