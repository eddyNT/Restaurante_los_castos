"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cartTotal, removedLabel, useCart } from "@/store/cart";
import { bs } from "@/lib/format";
import type { SlotDay } from "@/lib/hours";

type Address = { id: string; label: string; line: string; reference: string | null };
type OrderType = "TAKEAWAY" | "DINE_IN" | "DELIVERY";

export function CheckoutForm(props: {
  loggedIn: boolean;
  defaultName: string;
  defaultPhone: string;
  addresses: Address[];
  deliveryFee: number;
  qrAvailable: boolean;
  status: { open: boolean; label: string };
  /** Turnos para recoger o llegar: hoy, o el siguiente día abierto si hoy ya no quedan. */
  slotDay: SlotDay | null;
}) {
  const router = useRouter();
  const { items, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const slots = props.slotDay?.slots ?? [];
  const canSchedule = slots.length > 0;
  const [type, setType] = useState<OrderType>(canSchedule ? "TAKEAWAY" : "DELIVERY");
  const [time, setTime] = useState(slots[0]?.value ?? "");
  const timeLabel = slots.find((s) => s.value === time)?.time ?? "";
  const dayLabel = props.slotDay?.label ?? "";
  const [payment, setPayment] = useState<"CASH" | "QR">(props.qrAvailable ? "QR" : "CASH");
  const [name, setName] = useState(props.defaultName);
  const [phone, setPhone] = useState(props.defaultPhone);
  const [address, setAddress] = useState(props.addresses[0] ? formatAddress(props.addresses[0]) : "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p>No hay productos en tu carrito.</p>
        <Link href="/menu" className="btn-primary mt-4">Ir al menú</Link>
      </div>
    );
  }

  if (!props.loggedIn) {
    return (
      <div className="card p-8 text-center">
        <p className="text-lg font-semibold">Ingresa para terminar tu pedido</p>
        <p className="mt-1 text-muted">Tu carrito se mantiene guardado.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/login?next=/checkout" className="btn-primary">Ingresar</Link>
          <Link href="/registro?next=/checkout" className="btn-ghost">Crear cuenta</Link>
        </div>
      </div>
    );
  }

  const subtotal = cartTotal(items);
  const fee = type === "DELIVERY" ? props.deliveryFee : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, removed: i.removed, notes: i.notes || undefined })),
        type,
        scheduledTime: type === "DELIVERY" ? undefined : time,
        paymentMethod: payment,
        customerName: name,
        customerPhone: phone,
        deliveryAddress: type === "DELIVERY" ? address : undefined,
        notes: notes || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "No pudimos registrar el pedido.");
      setSending(false);
      return;
    }
    clear();
    router.push(`/pedidos/${data.code}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        {!props.status.open && (
          <p className="rounded-lg bg-accent-soft px-4 py-3 text-sm">
            <b>{props.status.label}.</b> Puedes enviar el pedido y lo atenderemos al abrir.
          </p>
        )}

        <fieldset className="card space-y-3 p-5">
          <legend className="px-1 font-display font-semibold">¿Cómo lo quieres?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {TYPES.map(({ t, icon, title, sub }) => {
              const disabled = t !== "DELIVERY" && !canSchedule;
              return (
                <label
                  key={t}
                  className={`card p-3 ${disabled ? "opacity-50" : "cursor-pointer"} ${type === t ? "border-brand ring-2 ring-brand/20" : ""}`}
                >
                  <input type="radio" name="type" className="sr-only" disabled={disabled} checked={type === t} onChange={() => setType(t)} />
                  <span className="font-semibold">{icon} {title}</span>
                  <span className="block text-sm text-muted">
                    {disabled ? "Sin horarios disponibles" : t === "DELIVERY" ? `${sub} · + ${bs(props.deliveryFee)}` : sub}
                  </span>
                </label>
              );
            })}
          </div>
          {type !== "DELIVERY" && canSchedule && (
            <div>
              {dayLabel !== "Hoy" && (
                <p className="mb-2 rounded-lg bg-accent-soft px-3 py-2 text-sm">
                  Hoy ya no quedan horarios. Puedes programarlo para <b>{dayLabel.toLowerCase()}</b>.
                </p>
              )}
              <label className="label" htmlFor="time">
                {type === "DINE_IN" ? "¿A qué hora llegas?" : "¿A qué hora pasas a recoger?"} ({dayLabel})
              </label>
              <select id="time" className="input max-w-xs" required value={time} onChange={(e) => setTime(e.target.value)}>
                {slots.map((s, i) => (
                  <option key={s.value} value={s.value}>{i === 0 ? `${s.time} (lo más pronto)` : s.time}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                {type === "DINE_IN" ? "Tendremos tu pedido listo para servir cuando llegues." : "Tu pedido estará listo a esa hora."}
              </p>
            </div>
          )}
          {type === "DELIVERY" && (
            <div>
              {props.addresses.length > 0 && (
                <select className="input mb-2" onChange={(e) => setAddress(e.target.value)} aria-label="Direcciones guardadas">
                  {props.addresses.map((a) => (
                    <option key={a.id} value={formatAddress(a)}>{a.label}: {a.line}</option>
                  ))}
                </select>
              )}
              <label className="label" htmlFor="address">Dirección de entrega</label>
              <textarea id="address" className="input" rows={2} required value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
          )}
        </fieldset>

        <fieldset className="card grid gap-3 p-5 sm:grid-cols-2">
          <legend className="px-1 font-display font-semibold">Tus datos</legend>
          <div>
            <label className="label" htmlFor="name">Nombre</label>
            <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="phone">Celular</label>
            <input id="phone" className="input" required inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">Nota para el pedido (opcional)</label>
            <input id="notes" className="input" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </fieldset>

        <fieldset className="card space-y-2 p-5">
          <legend className="px-1 font-display font-semibold">Pago</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className={`card p-3 ${props.qrAvailable ? "cursor-pointer" : "opacity-50"} ${payment === "QR" ? "border-brand ring-2 ring-brand/20" : ""}`}>
              <input type="radio" name="payment" className="sr-only" disabled={!props.qrAvailable} checked={payment === "QR"} onChange={() => setPayment("QR")} />
              <span className="font-semibold">QR</span>
              <span className="block text-sm text-muted">{props.qrAvailable ? "Pagas desde tu banco" : "No disponible"}</span>
            </label>
            <label className={`card cursor-pointer p-3 ${payment === "CASH" ? "border-brand ring-2 ring-brand/20" : ""}`}>
              <input type="radio" name="payment" className="sr-only" checked={payment === "CASH"} onChange={() => setPayment("CASH")} />
              <span className="font-semibold">Efectivo</span>
              <span className="block text-sm text-muted">Al recibir</span>
            </label>
          </div>
          {payment === "QR" && (
            <p className="text-sm text-muted">Después de confirmar verás el QR y podrás subir tu comprobante.</p>
          )}
        </fieldset>
      </div>

      <aside className="card h-fit space-y-3 p-5 md:sticky md:top-24">
        <p className="font-display font-semibold">Resumen</p>
        <ul className="space-y-1 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-2">
              <span>
                {i.quantity} × {i.name}
                {i.removed.length > 0 && <span className="block text-xs font-bold text-brand">{removedLabel(i.removed)}</span>}
              </span>
              <span className="tabular-nums">{bs(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm font-semibold">
          {TYPES.find((x) => x.t === type)?.icon} {TYPES.find((x) => x.t === type)?.title}
          {type !== "DELIVERY" && timeLabel && ` · ${type === "DINE_IN" ? "llegas" : "recoges"} ${dayLabel.toLowerCase()} a las ${timeLabel}`}
        </p>
        <div className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{bs(subtotal)}</span></div>
          {fee > 0 && <div className="flex justify-between"><span>Delivery</span><span className="tabular-nums">{bs(fee)}</span></div>}
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="tabular-nums">{bs(subtotal + fee)}</span></div>
        </div>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={sending} className="btn-primary w-full">
          {sending ? "Enviando…" : "Enviar pedido"}
        </button>
      </aside>
    </form>
  );
}

const TYPES: { t: OrderType; icon: string; title: string; sub: string }[] = [
  { t: "TAKEAWAY", icon: "🥡", title: "Para llevar", sub: "Recoges en el local" },
  { t: "DINE_IN", icon: "🍽️", title: "En mesa", sub: "Comes en el local" },
  { t: "DELIVERY", icon: "🏠", title: "Para casa", sub: "Delivery" },
];

function formatAddress(a: Address) {
  return a.reference ? `${a.line} (${a.reference})` : a.line;
}
