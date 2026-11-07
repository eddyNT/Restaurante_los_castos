type Hour = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean };

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Fecha y hora actuales en Bolivia, independientes de la zona del servidor. */
function nowInBolivia() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    weekday: "short",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    day,
    time: `${get("hour").replace("24", "00")}:${get("minute")}`,
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function openStatus(hours: Hour[]) {
  const { day, time } = nowInBolivia();
  const today = hours.find((h) => h.dayOfWeek === day);
  if (!today || today.isClosed) return { open: false, label: "Hoy cerrado" };
  if (time >= today.opensAt && time < today.closesAt) return { open: true, label: `Abierto hasta las ${today.closesAt}` };
  if (time < today.opensAt) return { open: false, label: `Abre hoy a las ${today.opensAt}` };
  return { open: false, label: "Cerrado por hoy" };
}

export const SLOT_MINUTES = 15;

/** Un turno para recoger o llegar. `value` = «2026-10-30 11:00» (hora de Bolivia). */
export type Slot = { value: string; time: string };
export type SlotDay = { label: string; slots: Slot[] };

/**
 * Turnos para recoger el pedido o llegar a comer: cada 15 minutos dentro del horario,
 * desde ahora + el tiempo de preparación. Si hoy ya no queda ninguno, los del siguiente día abierto.
 */
export function pickupSlots(hours: Hour[], prepMinutes: number): SlotDay | null {
  const now = nowInBolivia();
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(Date.UTC(now.y, now.m - 1, now.d + offset));
    const h = hours.find((x) => x.dayOfWeek === date.getUTCDay());
    if (!h || h.isClosed) continue;
    const from = offset === 0 ? Math.max(toMinutes(h.opensAt), toMinutes(now.time) + prepMinutes) : toMinutes(h.opensAt);
    const ymd = date.toISOString().slice(0, 10);
    const slots: Slot[] = [];
    for (let m = Math.ceil(from / SLOT_MINUTES) * SLOT_MINUTES; m < toMinutes(h.closesAt); m += SLOT_MINUTES) {
      slots.push({ value: `${ymd} ${toHHMM(m)}`, time: toHHMM(m) });
    }
    if (slots.length === 0) continue;
    const name = DAY_NAMES[date.getUTCDay()];
    const label = offset === 0 ? "Hoy" : offset === 1 ? `Mañana ${name}` : name.charAt(0).toUpperCase() + name.slice(1);
    return { label, slots };
  }
  return null;
}

/** «2026-10-30 13:30» (hora de Bolivia) como fecha absoluta. Bolivia es UTC-4 todo el año. */
export function slotToDate(value: string): Date {
  const [ymd, hhmm] = value.split(" ");
  const [y, m, d] = ymd.split("-").map(Number);
  const min = toMinutes(hhmm);
  return new Date(Date.UTC(y, m - 1, d, Math.floor(min / 60) + 4, min % 60));
}
