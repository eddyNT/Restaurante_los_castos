type Hour = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean };

/** Hora actual en Bolivia, independiente de la zona del servidor. */
function nowInBolivia() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, time: `${get("hour").replace("24", "00")}:${get("minute")}` };
}

export function openStatus(hours: Hour[]) {
  const { day, time } = nowInBolivia();
  const today = hours.find((h) => h.dayOfWeek === day);
  if (!today || today.isClosed) return { open: false, label: "Hoy cerrado" };
  if (time >= today.opensAt && time < today.closesAt) return { open: true, label: `Abierto hasta las ${today.closesAt}` };
  if (time < today.opensAt) return { open: false, label: `Abre hoy a las ${today.opensAt}` };
  return { open: false, label: "Cerrado por hoy" };
}
