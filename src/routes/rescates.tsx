import { profileOf } from "@/lib/skillswap/profile";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, LifeBuoy, Send, Tag, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";

import { UserAvatar } from "@/components/skillswap/avatar";
import { EmptyState, PageHeader, PageSkeleton, Pill, RescueStatusPill } from "@/components/skillswap/bits";
import { Button } from "@/components/ui/button";
import { availableOf } from "@/lib/skillswap/engine";
import { rescueRelevance } from "@/lib/skillswap/insights";
import { SchedulePicker } from "@/components/skillswap/schedule-picker";
import { DEFAULT_TIME_ZONE } from "@/lib/skillswap/time";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ago } from "@/lib/skillswap/format";
import { CATEGORIES, DURATIONS, type Category, type DemoState, type Duration, type Rescue, type RescueStatus } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rescates")({
  head: () => ({
    meta: [
      { title: "Rescates — SkillSwap" },
      { name: "description", content: "Publica una duda de 15 o 30 minutos y recibe ayuda rápida de otro coder." },
      { property: "og:title", content: "Rescates — SkillSwap" },
      { property: "og:description", content: "Publica una duda de 15 o 30 minutos y recibe ayuda rápida de otro coder." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RescatesPage,
});

type Filter = "all" | Exclude<RescueStatus, "withdrawn">;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abiertos" },
  { id: "accepted", label: "Aceptados" },
  { id: "completed", label: "Completados" },
];

function RescatesPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  if (!state) return <PageSkeleton />;

  const visible = state.rescues.filter((r) => r.status !== "withdrawn" && (filter === "all" || r.status === filter) && (!recommendedOnly || rescueRelevance(state, state.activeUserId, r) > 0)).sort((a, b) => rescueRelevance(state, state.activeUserId, b) - rescueRelevance(state, state.activeUserId, a) || b.createdAt - a.createdAt);
  const relevant = state.rescues.filter((r) => rescueRelevance(state, state.activeUserId, r) > 0).length;
  const draftKey = `${state.activeUserId}-${state.drafts[state.activeUserId] ? "draft" : "blank"}`;

  return (
    <div className="animate-pop-in">
      <PageHeader
        title="Rescates"
        subtitle="¿Te atascaste? Publica tu duda y otra persona de la comunidad la acepta. Los minutos solo se transfieren cuando ambos confirman."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <RescueForm key={draftKey} state={state} />

        <section aria-labelledby="lista-rescates">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="lista-rescates" className="text-xl font-bold sm:text-2xl">
              Dudas de la comunidad
            </h2>
            <div role="group" aria-label="Filtrar rescates" className="flex flex-wrap gap-1.5">
              <button type="button" aria-pressed={recommendedOnly} onClick={() => setRecommendedOnly(!recommendedOnly)} className="rounded-full border border-brand bg-brand-softer px-3 py-1.5 text-sm font-bold aria-pressed:bg-primary aria-pressed:text-primary-foreground">Para ti ({relevant})</button>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-brand-softer aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 ? (
            <EmptyState icon={<LifeBuoy className="size-6" />} title="No hay rescates aquí">
              Prueba otro filtro o publica tu propia duda.
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {visible.map((r) => (
                <li key={r.id}>
                  <RescueCard rescue={r} state={state} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function RescueForm({ state }: { state: DemoState }) {
  const { act } = useApp();
  const me = profileOf(state, state.activeUserId);
  const draft = state.drafts[me.id];
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [category, setCategory] = useState<Category>(draft?.category ?? "Programación");
  const [minutes, setMinutes] = useState<Duration>(draft?.minutes ?? 15);
  const [timing, setTiming] = useState<"immediate" | "scheduled">("immediate");
  const [busy, setBusy] = useState(false);
  const available = availableOf(state, me.id);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const ok = await act({ type: "publishRescue", userId: me.id, title, description, category, minutes, timing });
    if (ok) {
      setTitle("");
      setDescription("");
    }
    setBusy(false);
  }

  return (
    <section aria-labelledby="pide-rescate" className="lg:sticky lg:top-24 lg:self-start">
      <form onSubmit={onSubmit} className="card-surface space-y-5 bg-gradient-rescue p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-brand shadow-card">
            <LifeBuoy className="size-6" aria-hidden />
          </span>
          <div>
            <h2 id="pide-rescate" className="text-xl font-bold">
              Pide un rescate
            </h2>
            <p className="text-sm text-muted-foreground">Publicas como {me.name}.</p>
          </div>
        </div>
        {draft && (
          <p className="rounded-xl bg-card/70 px-3 py-2 text-sm text-muted-foreground">
            Tienes una duda guardada lista para publicar.
          </p>
        )}

        <div className="space-y-1.5">
          <label htmlFor="r-title" className="text-sm font-semibold">
            Título
          </label>
          <input
            id="r-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            maxLength={90}
            placeholder="Ej.: Mi grid se desborda en celular"
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="r-desc" className="text-sm font-semibold">
            Descripción
          </label>
          <textarea
            id="r-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={4}
            placeholder="Cuenta qué intentaste y dónde te atascaste."
            className="w-full resize-y rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="r-cat" className="text-sm font-semibold">
            Categoría
          </label>
          <select
            id="r-cat"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-semibold">Duración</legend>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => (
              <label
                key={d}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-xl border bg-card px-3 py-3 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  minutes === d ? "border-primary text-primary" : "border-input hover:bg-brand-softer",
                )}
              >
                <input
                  type="radio"
                  name="r-minutes"
                  value={d}
                  checked={minutes === d}
                  onChange={() => setMinutes(d)}
                  className="sr-only"
                />
                <Clock className="size-4" aria-hidden />
                {d} minutos
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2"><legend className="text-sm font-semibold">¿Cuándo necesitas ayuda?</legend>
          <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={timing === "immediate"} onChange={() => setTiming("immediate")} /> Ayuda inmediata</label><label className="flex items-center gap-2"><input type="radio" checked={timing === "scheduled"} onChange={() => setTiming("scheduled")} /> Programar con quien me ayude</label></div>
        </fieldset>
        <p
          className={cn(
            "rounded-xl px-3 py-2 text-sm",
            available >= minutes ? "bg-mint-soft text-mint-foreground" : "bg-warning-soft text-warning-foreground",
          )}
          role="status"
        >
          {available >= minutes
            ? `Tienes ${available} min disponibles. Se reservan ${minutes} min cuando alguien acepte.`
            : `Tienes ${available} min disponibles. Nadie podrá aceptar este rescate hasta que tengas ${minutes} min.`}
        </p>

        <Button type="submit" variant="rescue" size="lg" className="w-full" disabled={busy}>
          <Zap aria-hidden /> Publicar rescate
        </Button>
      </form>
    </section>
  );
}

function RescueCard({ rescue, state }: { rescue: Rescue; state: DemoState }) {
  const { act, real } = useApp();
  const [busy, setBusy] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedAt, setSelectedAt] = useState<number | undefined>();
  const me = state.activeUserId;
  const author = profileOf(state, rescue.authorId);
  const helper = rescue.helperId ? profileOf(state, rescue.helperId) : null;
  const mine = rescue.authorId === me;
  const authorAvailable = availableOf(state, rescue.authorId);
  const canAfford = real || authorAvailable >= rescue.minutes;
  const participant = mine || rescue.helperId === me;

  async function accept(at?: number) {
    if (busy) return;
    setBusy(true);
    const ok = await act({ type: "acceptRescue", userId: me, rescueId: rescue.id, ...(at !== undefined ? { scheduledAt: at, timeZone: state.profiles[me]?.timeZone ?? DEFAULT_TIME_ZONE } : {}) });
    if (ok) setScheduleOpen(false);
    setBusy(false);
  }

  return (
    <article className="card-surface p-5" aria-labelledby={`${rescue.id}-t`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar userId={author.id} src={author.photoUrl} name={author.name} size="sm" />
          <div className="text-sm">
            <p className="font-semibold">
              {author.name}
              {mine && <span className="font-normal text-muted-foreground"> (tú)</span>}
            </p>
            <p className="text-muted-foreground">{ago(rescue.createdAt)}</p>
          </div>
        </div>
        <RescueStatusPill status={rescue.status} />
      </div>

      <h3 id={`${rescue.id}-t`} className="mt-4 text-lg font-semibold">
        {rescue.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{rescue.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Pill tone="brand">
          <Tag className="size-3.5" aria-hidden /> {rescue.category}
        </Pill>
        <Pill tone="mint"><Clock className="size-3.5" aria-hidden /> {rescue.minutes} min</Pill>
        <Pill tone="muted">{rescue.timing === "scheduled" ? "Programado" : "Inmediato"}</Pill>
        {rescueRelevance(state, me, rescue) > 0 && <Pill tone="mint">Compatible contigo</Pill>}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {rescue.status === "open" && !mine && (
          <>
            <p className="text-sm text-muted-foreground">
              {canAfford
                ? `Recibirás ${rescue.minutes} min cuando ambos confirmen.`
                : `${author.name} solo tiene ${authorAvailable} min disponibles.`}
            </p>
            {rescue.timing === "scheduled" ? <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild><Button disabled={busy || !canAfford}><Send aria-hidden /> Elegir horario</Button></DialogTrigger>
              <DialogContent className="max-h-[88vh] overflow-y-auto"><DialogHeader><DialogTitle>Programar rescate</DialogTitle><DialogDescription>Elige una fecha libre en tu agenda. También se validará la disponibilidad de quien solicita ayuda.</DialogDescription></DialogHeader>
                <SchedulePicker state={state} learnerId={rescue.authorId} mentorId={me} minutes={rescue.minutes} value={selectedAt} onChange={setSelectedAt} />
                <Button disabled={busy || selectedAt === undefined} onClick={() => void accept(selectedAt)}>{busy ? "Guardando…" : "Aceptar en ese horario"}</Button>
              </DialogContent>
            </Dialog> : <Button onClick={() => void accept()} disabled={busy || !canAfford}><Send aria-hidden /> Aceptar rescate</Button>}
          </>
        )}
        {rescue.status === "open" && mine && (
          <>
            <p className="text-sm text-muted-foreground">Esperando a que alguien lo acepte.</p>
            <Button variant="ghost" size="sm" onClick={() => act({ type: "withdrawRescue", userId: me, rescueId: rescue.id })}>
              Retirar
            </Button>
          </>
        )}
        {rescue.status === "accepted" && helper && (
          <>
            <p className="flex items-center gap-2 text-sm">
              <UserAvatar userId={helper.id} src={helper.photoUrl} name={helper.name} size="xs" />
              Aceptado por <strong>{helper.id === me ? "ti" : helper.name}</strong>
            </p>
            {participant && (
              <Button asChild variant="outline" size="sm">
                <Link to="/intercambios">Confirmar en Mis intercambios</Link>
              </Button>
            )}
          </>
        )}
        {rescue.status === "completed" && helper && (
          <p className="flex items-center gap-2 text-sm">
            <UserAvatar userId={helper.id} src={helper.photoUrl} name={helper.name} size="xs" />
            Resuelto por <strong>{helper.id === me ? "ti" : helper.name}</strong> · {rescue.minutes} min transferidos
          </p>
        )}
      </div>
    </article>
  );
}
