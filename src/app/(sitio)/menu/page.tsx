import { getMenu } from "@/lib/menu";
import { getMainBranch } from "@/lib/settings";
import { TableBanner } from "@/components/TableBanner";
import { MenuBrowser } from "./MenuBrowser";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menú" };

export default async function MenuPage() {
  const branch = await getMainBranch();
  const menu = await getMenu(branch.id);

  return (
    <div>
      <TableBanner />
      <div className="mb-2">
        <p className="font-extrabold uppercase tracking-widest text-orange">Hecho al momento</p>
        <h1 className="text-5xl">Nuestro menú</h1>
      </div>
      {menu.length === 0 ? <p className="text-muted">Todavía no hay productos publicados.</p> : <MenuBrowser categories={menu} />}
    </div>
  );
}
