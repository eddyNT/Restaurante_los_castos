import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getActiveSession } from "@/lib/auth";
import { canViewOrder } from "@/lib/orders";
import { PROOF_DIR } from "@/lib/upload";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

// Comprobante de pago: solo lo ven el dueño del pedido y el personal de su sucursal
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp)$/.test(name)) return new Response("No encontrado", { status: 404 });
  const payment = await db.payment.findFirst({
    where: { proofUrl: `/api/comprobantes/${name}` },
    include: { order: { select: { userId: true, branchId: true } } },
  });
  if (!payment || !canViewOrder(payment.order, await getActiveSession())) {
    return new Response("No encontrado", { status: 404 });
  }
  try {
    const data = await readFile(path.join(PROOF_DIR, name));
    return new Response(data, {
      headers: {
        "Content-Type": MIME[name.split(".").pop()!],
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
