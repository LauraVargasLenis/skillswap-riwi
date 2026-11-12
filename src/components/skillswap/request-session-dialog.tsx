import { CalendarPlus, Clock } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { availableOf } from "@/lib/skillswap/engine";
import { DURATIONS, type DemoState, type Duration, type Profile } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { cn } from "@/lib/utils";
import { TopupDialog } from "./topup-dialog";
import { SchedulePicker } from "./schedule-picker";
import { DEFAULT_TIME_ZONE, scheduledLabel } from "@/lib/skillswap/time";
import { schedulingError } from "@/lib/skillswap/engine";

export function RequestSessionDialog({
  mentor,
  state,
  resume = false,
}: {
  mentor: Profile;
  state: DemoState;
  resume?: boolean;
}) {
  const { act, real } = useApp();
  const [open, setOpen] = useState(false);
  const draft = resume ? state.requestDrafts?.[state.activeUserId] : undefined;
  const [topic, setTopic] = useState(draft?.topic ?? mentor.teaches[0]?.name ?? "");
  const [minutes, setMinutes] = useState<Duration>(draft?.minutes ?? 15);
  const [note, setNote] = useState(draft?.note ?? "");
  const [scheduledAt, setScheduledAt] = useState<number | undefined>(draft?.scheduledAt);
  const timeZone = mentor.timeZone ?? DEFAULT_TIME_ZONE;
  const [busy, setBusy] = useState(false);
  const me = state.activeUserId;
  const available = availableOf(state, me);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || available < minutes || scheduledAt === undefined) return;
    setBusy(true);
    const ok = await act({
      type: "requestSession",
      userId: me,
      mentorId: mentor.id,
      topic,
      minutes,
      note,
      scheduledAt,
      timeZone,
    });
    setBusy(false);
    if (ok) {
      setOpen(false);
      setNote("");
    }
  }

  const fieldId = `req-${mentor.id}`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && resume) {
          const saved = state.requestDrafts?.[me];
          if (saved && saved.mentorId === mentor.id) {
            setTopic(saved.topic);
            setMinutes(saved.minutes);
            setNote(saved.note);
            setScheduledAt(saved.scheduledAt);
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="w-full">
          <CalendarPlus aria-hidden /> {resume ? "Revisar borrador" : "Solicitar sesión"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Solicitar sesión con {mentor.name}
            </DialogTitle>
            <DialogDescription>
              No se mueve ningún minuto mientras la solicitud esté pendiente. Si {mentor.name}{" "}
              acepta, se reservan de tu saldo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label htmlFor={`${fieldId}-topic`} className="text-sm font-semibold">
              ¿Qué quieres aprender?
            </label>
            {mentor.teaches.length > 0 ? (
              <select
                id={`${fieldId}-topic`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                {mentor.teaches.map((s) => (
                  <option key={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                id={`${fieldId}-topic`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm"
              />
            )}
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Duración</legend>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map((d) => (
                <label
                  key={d}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    minutes === d
                      ? "border-primary bg-brand-softer text-primary"
                      : "border-input hover:bg-brand-softer",
                  )}
                >
                  <input
                    type="radio"
                    name={`${fieldId}-minutes`}
                    checked={minutes === d}
                    onChange={() => {
                      setMinutes(d);
                      setScheduledAt(undefined);
                    }}
                    className="sr-only"
                  />
                  <Clock className="size-4" aria-hidden /> {d} minutos
                </label>
              ))}
            </div>
          </fieldset>

          <SchedulePicker
            state={state}
            learnerId={me}
            mentorId={mentor.id}
            minutes={minutes}
            value={scheduledAt}
            onChange={setScheduledAt}
          />
          {scheduledAt !== undefined && (
            <p className="text-sm font-medium text-mint-foreground">
              {scheduledLabel(scheduledAt, timeZone)}
            </p>
          )}

          <div className="space-y-1.5">
            <label htmlFor={`${fieldId}-note`} className="text-sm font-semibold">
              Mensaje <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <textarea
              id={`${fieldId}-note`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Cuéntale en qué andas."
              className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm"
            />
          </div>

          <p
            className={cn(
              "rounded-xl px-3 py-2 text-sm",
              available >= minutes
                ? "bg-mint-soft text-mint-foreground"
                : "bg-warning-soft text-warning-foreground",
            )}
          >
            {available >= minutes
              ? `Tienes ${available} min disponibles.`
              : `Te faltan ${minutes - available} minutos. Tienes ${available} min disponibles.`}
          </p>
          {(available < minutes || !real) && (
            <TopupDialog
              beforeTopup={async () => {
                return act(
                  {
                    type: "saveRequestDraft",
                    userId: me,
                    mentorId: mentor.id,
                    topic,
                    minutes,
                    note,
                    scheduledAt,
                    timeZone,
                  },
                  { silent: true },
                );
              }}
              onReturn={() => setOpen(true)}
            />
          )}
          {draft && (
            <p className="text-sm text-muted-foreground">
              Borrador guardado. Revisa el tema y la duración antes de enviarlo.
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                busy ||
                available < minutes ||
                scheduledAt === undefined ||
                Boolean(schedulingError(state, me, mentor.id, scheduledAt, minutes))
              }
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
