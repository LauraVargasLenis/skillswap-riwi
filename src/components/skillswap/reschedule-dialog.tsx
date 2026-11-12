import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SchedulePicker } from "./schedule-picker";
import type { DemoState, Session } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { DEFAULT_TIME_ZONE, scheduledLabel } from "@/lib/skillswap/time";

export function RescheduleDialog({ session, state }: { session: Session; state: DemoState }) {
  const { act } = useApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<number>();
  const [busy, setBusy] = useState(false);
  const zone = state.profiles[session.mentorId]?.timeZone ?? DEFAULT_TIME_ZONE;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock aria-hidden /> Reprogramar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Proponer otro horario</DialogTitle>
          <DialogDescription>
            La reserva original se mantiene hasta que la otra persona acepte.
          </DialogDescription>
        </DialogHeader>
        <SchedulePicker
          state={state}
          learnerId={session.learnerId}
          mentorId={session.mentorId}
          minutes={session.minutes}
          value={value}
          onChange={setValue}
          excludeSessionId={session.id}
        />
        {value !== undefined && <p className="text-sm text-brand">{scheduledLabel(value, zone)}</p>}
        <Button
          disabled={busy || value === undefined || value === session.scheduledAt}
          onClick={async () => {
            if (value === undefined) return;
            setBusy(true);
            const ok = await act({
              type: "proposeReschedule",
              userId: state.activeUserId,
              sessionId: session.id,
              scheduledAt: value,
              timeZone: zone,
            });
            setBusy(false);
            if (ok) setOpen(false);
          }}
        >
          Enviar propuesta
        </Button>
      </DialogContent>
    </Dialog>
  );
}
