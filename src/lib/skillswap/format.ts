import { formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

import type { Availability } from "./types";
import { hasAvailableDay } from "./availability";

export const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DAY_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
/** Monday-first order for pickers. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function time12(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "p. m." : "a. m.";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatDays(days: number[]): string {
  const sorted = WEEK_ORDER.filter((d) => days.includes(d));
  if (sorted.length === 7) return "Todos los días";
  if (
    sorted.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d)) &&
    sorted.every((d) => d >= 1 && d <= 5)
  )
    return "Lun a Vie";
  if (sorted.length === 6 && [1, 2, 3, 4, 5, 6].every((d) => days.includes(d))) return "Lun a Sáb";
  return sorted.map((d) => DAY_SHORT[d]).join(", ");
}

export function availabilityLines(a: Availability): string[] {
  const groups = new Map<string, { days: number[]; from: string; to: string }>();
  for (const day of WEEK_ORDER) {
    for (const slot of a
      .filter((s) => s.day === day)
      .sort((x, y) => x.from.localeCompare(y.from))) {
      const key = `${slot.from}-${slot.to}`;
      const group = groups.get(key);
      if (group && !group.days.includes(day)) group.days.push(day);
      else if (!group) groups.set(key, { days: [day], from: slot.from, to: slot.to });
    }
  }
  return Array.from(groups.values()).map(
    (g) => `${formatDays(g.days)} · ${time12(g.from)} – ${time12(g.to)}`,
  );
}

export function formatAvailability(a: Availability): string {
  return availabilityLines(a).join("; ") || "Sin días disponibles";
}

export function isAvailableToday(a: Availability, now = new Date()): boolean {
  return hasAvailableDay(a, now.getDay());
}

export function ago(ts: number): string {
  if (Date.now() - ts < 60_000) return "justo ahora";
  return formatDistanceToNowStrict(ts, { addSuffix: true, locale: es });
}

export function initials(name: string) {
  return name.slice(0, 1).toUpperCase();
}
