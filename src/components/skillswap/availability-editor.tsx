import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DAY_LONG, DAY_SHORT, WEEK_ORDER } from "@/lib/skillswap/format";
import type { Availability } from "@/lib/skillswap/types";
import { cn } from "@/lib/utils";

const input =
  "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function AvailabilityEditor({
  slots,
  onChange,
  blockedDates,
  onBlockedDatesChange,
  timeZone,
  onTimeZoneChange,
  error,
}: {
  slots: Availability;
  onChange: (slots: Availability) => void;
  blockedDates: string[];
  onBlockedDatesChange: (dates: string[]) => void;
  timeZone: string;
  onTimeZoneChange: (zone: string) => void;
  error: string | null;
}) {
  const [inactive, setInactive] = useState<Availability>([]);
  const [date, setDate] = useState("");
  function toggle(day: number) {
    const current = slots.filter((s) => s.day === day);
    if (current.length) {
      setInactive([...inactive.filter((s) => s.day !== day), ...current]);
      onChange(slots.filter((s) => s.day !== day));
    } else {
      const saved = inactive.filter((s) => s.day === day);
      onChange([...slots, ...(saved.length ? saved : [{ day, from: "", to: "" }])]);
    }
  }
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Días disponibles" className="flex flex-wrap gap-2">
        {WEEK_ORDER.map((day) => (
          <label
            key={day}
            className={cn(
              "grid h-11 min-w-14 cursor-pointer place-items-center rounded-xl border px-3 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              slots.some((s) => s.day === day)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card hover:bg-brand-softer",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              aria-label={DAY_LONG[day]}
              checked={slots.some((s) => s.day === day)}
              onChange={() => toggle(day)}
            />
            <span aria-hidden>{DAY_SHORT[day]}</span>
          </label>
        ))}
      </div>
      <div className="divide-y divide-border">
        {WEEK_ORDER.map((day) => {
          const rows = slots
            .map((slot, index) => ({ slot, index }))
            .filter(({ slot }) => slot.day === day);
          if (!rows.length) return null;
          return (
            <div
              key={day}
              role="group"
              aria-label={`Horario del ${DAY_LONG[day]}`}
              className="space-y-3 py-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-brand">{DAY_LONG[day]}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Agregar franja ${DAY_LONG[day]}`}
                  onClick={() => onChange([...slots, { day, from: "", to: "" }])}
                >
                  <Plus aria-hidden /> Franja
                </Button>
              </div>
              {rows.map(({ slot, index }, row) => (
                <div
                  key={`${day}-${row}`}
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"
                >
                  {(["from", "to"] as const).map((field) => (
                    <label key={field} className="min-w-0 space-y-1 text-sm font-semibold">
                      {field === "from" ? "Desde" : "Hasta"}
                      <input
                        type="time"
                        aria-label={`${field === "from" ? "Desde" : "Hasta"} ${DAY_LONG[day]}${row ? ` franja ${row + 1}` : ""}`}
                        value={slot[field]}
                        aria-invalid={Boolean(error?.startsWith(`${DAY_LONG[day]}:`))}
                        className={input}
                        onChange={(e) =>
                          onChange(
                            slots.map((s, i) =>
                              i === index ? { ...s, [field]: e.target.value } : s,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar franja ${row + 1} ${DAY_LONG[day]}`}
                    onClick={() => onChange(slots.filter((_, i) => i !== index))}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <label className="block space-y-1.5 text-sm font-semibold">
        Zona horaria
        <input
          aria-label="Zona horaria"
          value={timeZone}
          onChange={(e) => onTimeZoneChange(e.target.value)}
          list="time-zones"
          className={input}
        />
        <datalist id="time-zones">
          {[
            "America/Bogota",
            "America/Mexico_City",
            "America/Lima",
            "America/New_York",
            "Europe/Madrid",
            "UTC",
          ].map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </label>
      <div className="space-y-2">
        <label htmlFor="blocked-date" className="text-sm font-semibold">
          Fechas no disponibles
        </label>
        <div className="flex min-w-0 gap-2">
          <input
            id="blocked-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={input}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!date}
            onClick={() => {
              onBlockedDatesChange([...new Set([...blockedDates, date])].sort());
              setDate("");
            }}
            aria-label="Bloquear fecha"
          >
            <Plus aria-hidden />
          </Button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {blockedDates.map((d) => (
            <li key={d} className="flex items-center gap-1 rounded-lg bg-brand-soft pl-3 text-sm">
              {d}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Desbloquear ${d}`}
                onClick={() => onBlockedDatesChange(blockedDates.filter((v) => v !== d))}
              >
                <X aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
