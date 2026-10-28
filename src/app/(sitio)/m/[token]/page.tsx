import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SetTable } from "./SetTable";

export default async function TableEntry({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const table = await db.diningTable.findUnique({ where: { qrToken: token } });
  if (!table) notFound();
  return <SetTable token={token} number={table.number} />;
}
