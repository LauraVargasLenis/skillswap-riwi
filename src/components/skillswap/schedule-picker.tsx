import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { bookableSlots } from "@/lib/skillswap/engine";
import { DEFAULT_TIME_ZONE, localParts } from "@/lib/skillswap/time";
import { time12 } from "@/lib/skillswap/format";
import type { DemoState } from "@/lib/skillswap/types";
import { useState } from "react";

const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function SchedulePicker({
  state,
  learnerId,
  mentorId,
  minutes,
  value,
  onChange,
  excludeSessionId,
}: {
  state: DemoState;
  learnerId: string;
  mentorId: string;
  minutes: number;
  value?: number | undefined;
  onChange: (at: number | undefined) => void;
  excludeSessionId?: string;
}) {
  const zone = state.profiles[mentorId]?.timeZone ?? DEFAULT_TIME_ZONE;
  const initial = value !== undefined ? localParts(value, zone).date : undefined;
  const [date, setDate] = useState<Date | undefined>(
    initial ? new Date(`${initial}T12:00:00`) : undefined,
  );
  const now = Date.now();
  const slots = date
    ? bookableSlots(state, learnerId, mentorId, dateKey(date), minutes, now, excludeSessionId)
    : [];
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="text-sm font-semibold">Fecha y hora</legend>
      <p className="text-xs text-muted-foreground">Horario del mentor · {zone}</p>
      <Calendar
        mode="single"
        locale={es}
        weekStartsOn={1}
        selected={date}
        {...(date ? { defaultMonth: date } : {})}
        onSelect={(d) => {
          setDate(d);
          onChange(undefined);
        }}
        disabled={(d) =>
          bookableSlots(state, learnerId, mentorId, dateKey(d), minutes, now, excludeSessionId)
            .length === 0
        }
        className="mx-auto max-w-full rounded-lg border border-border"
      />
      {date && (
        <div
          role="group"
          aria-label="Horas disponibles"
          className="grid grid-cols-3 gap-2 sm:grid-cols-4"
        >
          {slots.map((at) => (
            <Button
              key={at}
              type="button"
              size="sm"
              variant={at === value ? "default" : "outline"}
              aria-pressed={at === value}
              onClick={() => onChange(at)}
            >
              {time12(localParts(at, zone).time)}
            </Button>
          ))}
          {slots.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              No quedan horarios para esta duración. Selecciona otra fecha.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
