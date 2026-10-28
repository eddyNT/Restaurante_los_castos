import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickView } from "@/components/QuickView";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <QuickView />
    </>
  );
}
