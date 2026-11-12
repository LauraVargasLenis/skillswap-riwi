import { useState } from "react";
import { Star, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApp } from "@/lib/skillswap/use-app";
import type { Session } from "@/lib/skillswap/types";

export function SessionReview({ session }: { session: Session }) {
  const { state, act } = useApp();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state || session.status !== "completed") return null;
  const me = state.activeUserId;
  if (session.mentorId !== me && session.learnerId !== me) return null;
  const prior = (state.reviews ?? []).find((r) => r.authorId === me && r.sessionId === session.id);
  if (prior) return <span className="text-xs text-mint-foreground">Valoraste {prior.rating}★</span>;
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline"><Star className="size-4" /> Valorar</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Valorar intercambio completado</DialogTitle><DialogDescription>Una valoración verificada por participante y sesión.</DialogDescription></DialogHeader>
      <fieldset><legend className="mb-2 text-sm font-semibold">¿Cómo fue la experiencia?</legend><div className="flex gap-1">{[1,2,3,4,5].map((n) => <button type="button" key={n} aria-label={`${n} estrellas`} aria-pressed={rating === n} onClick={() => setRating(n)} className="rounded p-1 focus-visible:ring-2 focus-visible:ring-ring"><Star className={`size-7 ${n <= rating ? "fill-current text-brand" : "text-muted-foreground"}`} /></button>)}</div></fieldset>
      <label className="text-sm font-semibold">Reseña
        <textarea className="mt-1 min-h-24 w-full rounded-lg border border-input bg-card p-3" maxLength={700} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="¿Qué aprendiste o cómo te ayudó?" />
      </label>
      <Button disabled={busy || comment.trim().length < 5} onClick={async () => { setBusy(true); try { if (await act({ type: "submitReview", userId: me, sessionId: session.id, rating, comment })) setOpen(false); } finally { setBusy(false); } }}>Publicar reseña</Button>
    </DialogContent>
  </Dialog>;
}

export function ReportSessionDialog({ session }: { session: Session }) {
  const { state, act } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<"conducta" | "inasistencia" | "incumplimiento" | "otro">("otro");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  if (!state || (session.learnerId !== state.activeUserId && session.mentorId !== state.activeUserId)) return null;
  const exists = (state.reports ?? []).some((r) => r.sessionId === session.id && r.authorId === state.activeUserId && r.status === "open");
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="ghost" size="sm" disabled={exists}><Flag className="size-4" /> {exists ? "Reporte enviado" : "Reportar"}</Button></DialogTrigger>
    <DialogContent><DialogHeader><DialogTitle>Reportar un problema</DialogTitle><DialogDescription>Solo reportas intercambios en los que participaste. El equipo de moderación revisará la situación.</DialogDescription></DialogHeader>
      <label className="text-sm font-semibold">Motivo<select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2"><option value="conducta">Comportamiento inapropiado</option><option value="inasistencia">No se presentó</option><option value="incumplimiento">Incumplió el acuerdo</option><option value="otro">Otro problema</option></select></label>
      <label className="text-sm font-semibold">Descripción<textarea maxLength={800} minLength={10} value={details} onChange={(e) => setDetails(e.target.value)} className="mt-1 min-h-24 w-full rounded-lg border border-input bg-card p-3" placeholder="Describe lo ocurrido (mínimo 10 caracteres)" /></label>
      <Button disabled={busy || details.trim().length < 10} onClick={async () => { setBusy(true); try { if (await act({ type: "reportSession", userId: state.activeUserId, sessionId: session.id, reason, details })) setOpen(false); } finally { setBusy(false); } }}>Enviar reporte</Button>
    </DialogContent>
  </Dialog>;
}
