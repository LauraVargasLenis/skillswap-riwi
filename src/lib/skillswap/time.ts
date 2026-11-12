import { Temporal } from "@js-temporal/polyfill";

export const DEFAULT_TIME_ZONE = "America/Bogota";
export function validTimeZone(zone: string): boolean {
  try {
    Temporal.Now.zonedDateTimeISO(zone);
    return true;
  } catch {
    return false;
  }
}
export function validDate(date: string): boolean {
  try {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && Temporal.PlainDate.from(date).toString() === date;
  } catch {
    return false;
  }
}
export function localParts(at: number, zone = DEFAULT_TIME_ZONE) {
  const value = Temporal.Instant.fromEpochMilliseconds(at).toZonedDateTimeISO(zone);
  return {
    date: value.toPlainDate().toString(),
    day: value.dayOfWeek % 7,
    time: `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`,
    second: value.second,
    millisecond: value.millisecond,
  };
}
export function localInstant(date: string, time: string, zone = DEFAULT_TIME_ZONE): number | null {
  try {
    return Temporal.PlainDateTime.from(`${date}T${time}`).toZonedDateTime(zone, {
      disambiguation: "reject",
    }).epochMilliseconds;
  } catch {
    return null;
  }
}
export function addDays(date: string, days: number): string {
  return Temporal.PlainDate.from(date).add({ days }).toString();
}
export function dateDay(date: string): number {
  return Temporal.PlainDate.from(date).dayOfWeek % 7;
}
export function scheduledLabel(at: number, zone = DEFAULT_TIME_ZONE): string {
  return `${new Intl.DateTimeFormat("es-CO", { timeZone: zone, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(at)} · ${zone}`;
}
