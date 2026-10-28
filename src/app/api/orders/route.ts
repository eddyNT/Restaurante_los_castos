import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOrder, orderInput, OrderError } from "@/lib/orders";

export async function POST(req: Request) {
  const parsed = orderInput.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos no válidos." }, { status: 400 });
  }
  try {
    const order = await createOrder(parsed.data, await getSession());
    return NextResponse.json({ code: order.code });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "No pudimos registrar el pedido. Intenta de nuevo." }, { status: 500 });
  }
}
