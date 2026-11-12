import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Code2,
  Coins,
  Languages,
  LifeBuoy,
  Palette,
  Search,
  SearchX,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { UserAvatar } from "@/components/skillswap/avatar";
import { EmptyState, PageSkeleton, Pill } from "@/components/skillswap/bits";
import { RequestSessionDialog } from "@/components/skillswap/request-session-dialog";
import { PublicProfileDialog } from "@/components/skillswap/public-profile-dialog";
import { Button } from "@/components/ui/button";
import { availableOf, nextScheduledSession } from "@/lib/skillswap/engine";
import { recommendationsFor, ratingsFor } from "@/lib/skillswap/insights";
import { DAY_LONG, WEEK_ORDER, availabilityLines, isAvailableToday } from "@/lib/skillswap/format";
import { hasAvailableDay } from "@/lib/skillswap/availability";
import {
  CATEGORIES,
  USER_IDS,
  type Category,
  type DemoState,
  type Profile,
} from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { TopupDialog } from "@/components/skillswap/topup-dialog";
import { scheduledLabel } from "@/lib/skillswap/time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Explorar — SkillSwap" },
      {
        name: "description",
        content: "Encuentra coders de RIWI que te pueden ayudar y paga con minutos de tu tiempo.",
      },
      { property: "og:title", content: "Explorar — SkillSwap" },
      {
        property: "og:description",
        content: "Encuentra coders de RIWI que te pueden ayudar y paga con minutos de tu tiempo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explorar,
});

const CATEGORY_ICON: Record<Category, typeof Code2> = {
  Programación: Code2,
  "HTML y CSS": BookOpen,
  Inglés: Languages,
  Diseño: Palette,
};

function Explorar() {
  const { state } = useApp();
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [day, setDay] = useState<string>("any");

  const people = useMemo(() => {
    if (!state) return [];
    const q = query.trim().toLowerCase();
    const today = new Date().getDay();
    return Object.values(state.profiles)
      .filter((p) => p.id !== state.activeUserId)
      .filter((p) => {
        if (q) {
          const hay = [p.name, ...p.teaches.map((s) => `${s.name} ${s.category}`)]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (category && !p.teaches.some((s) => s.category === category)) return false;
        if (day === "today" && !hasAvailableDay(p.availability, today)) return false;
        if (day !== "any" && day !== "today" && !hasAvailableDay(p.availability, Number(day)))
          return false;
        return true;
      });
  }, [state, query, category, day]);

  if (!state) return <PageSkeleton />;

  const filtered = query || category || day !== "any";
  const recommendations = recommendationsFor(state, state.activeUserId).slice(0, 3);
  function onSearch(e: FormEvent) {
    e.preventDefault();
    setQuery(draftQuery);
  }
  function clear() {
    setDraftQuery("");
    setQuery("");
    setCategory(null);
    setDay("any");
  }

  return (
    <div className="grid animate-pop-in gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="lg:col-start-1" aria-labelledby="hero-title">
        <h1 id="hero-title" className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          Lo que sabes te conecta.
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          Una comunidad de coders RIWI que intercambian ayuda usando minutos como créditos.
        </p>

        <form
          role="search"
          onSubmit={onSearch}
          className="mt-7 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-card focus-within:ring-2 focus-within:ring-ring"
        >
          <label htmlFor="buscar" className="sr-only">
            ¿Qué quieres aprender?
          </label>
          <Search className="ml-2 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            id="buscar"
            type="search"
            value={draftQuery}
            onChange={(e) => {
              setDraftQuery(e.target.value);
              setQuery(e.target.value);
            }}
            placeholder="¿Qué quieres aprender?"
            className="h-10 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit">Buscar</Button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c];
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(category === c ? null : c)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-medium transition-colors hover:bg-brand-soft/60 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                >
                  <Icon className="size-4" aria-hidden /> {c}
                </button>
              );
            })}
          </div>
          <label htmlFor="dia" className="sr-only">
            Disponibilidad
          </label>
          <select
            id="dia"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="h-9 rounded-full border border-border bg-card px-3 text-sm font-medium"
          >
            <option value="any">Cualquier día</option>
            <option value="today">Disponible hoy</option>
            {WEEK_ORDER.map((d) => (
              <option key={d} value={d}>
                {DAY_LONG[d]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <aside className="space-y-5 lg:col-start-2 lg:row-start-1" aria-label="Tu resumen">
        <RescueCta />
        <BalanceCta state={state} />
        <NextSession state={state} />
      </aside>

      <section className="lg:col-span-2" aria-labelledby="recomendados">
        <h2 id="recomendados" className="flex items-center gap-2 text-2xl font-bold"><Sparkles className="size-5 text-brand" /> Recomendados para ti</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Coincidencias explicables basadas en lo que quieres aprender, experiencia y horarios. No se usa IA generativa.</p>
        {recommendations.length === 0 ? <p className="card-surface p-4 text-sm text-muted-foreground">Agrega habilidades que quieres aprender en Mi perfil para encontrar recomendaciones.</p> :
          <ul className="grid gap-3 md:grid-cols-3">{recommendations.map(({ person, reciprocal, reasons, score }) => <li key={person.id} className="card-surface flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3"><UserAvatar userId={person.id} src={person.photoUrl} name={person.name} size="md" /><div><h3 className="font-bold">{person.name}</h3><p className="text-xs text-muted-foreground">Compatibilidad: {Math.min(100, Math.round(score))} puntos</p></div></div>
            {reciprocal && <span className="w-fit rounded-full bg-mint-soft px-3 py-1 text-xs font-bold">Intercambio recíproco</span>}
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">{reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            <div className="mt-auto"><RequestSessionDialog mentor={person} state={state} /></div>
          </li>)}</ul>}
      </section>
      <section className="lg:col-span-2" aria-labelledby="personas">
        <div className="mb-5 flex items-end justify-between gap-3">
          <h2 id="personas" className="text-2xl font-bold">
            Personas que te pueden ayudar
          </h2>
          {filtered && (
            <button
              type="button"
              onClick={clear}
              className="rounded-md text-sm font-semibold text-brand underline-offset-4 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <p className="sr-only" role="status">
          {people.length} {people.length === 1 ? "persona encontrada" : "personas encontradas"}
        </p>
        {people.length === 0 ? (
          <EmptyState icon={<SearchX className="size-6" />} title="Nadie coincide con tu búsqueda">
            Prueba con otra palabra, categoría o día.
          </EmptyState>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => (
              <li key={p.id}>
                <PersonCard person={p} state={state} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PersonCard({ person, state }: { person: Profile; state: DemoState }) {
  const today = isAvailableToday(person.availability);
  return (
    <article className="card-surface flex h-full flex-col p-5" aria-labelledby={`p-${person.id}`}>
      <div className="flex justify-end">
        {today ? (
          <Pill tone="mint" dot>
            Disponible hoy
          </Pill>
        ) : (
          <Pill tone="muted">Hoy no disponible</Pill>
        )}
      </div>
      <UserAvatar
        userId={person.id}
        name={person.name}
        src={person.photoUrl}
        size="xl"
        className="mx-auto mt-2 ring-4 ring-brand-softer"
      />
      <h3 id={`p-${person.id}`} className="mt-4 text-2xl font-bold">
        {person.name}
      </h3>
      <p className="text-sm text-muted-foreground">{person.tagline}</p>
      {person.bio && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{person.bio}</p>}
      {(() => { const rating = ratingsFor(state.reviews ?? [], person.id); return rating.count > 0 ? <p className="mt-2 flex items-center gap-1 text-sm font-semibold"><Star className="size-4 fill-current text-brand" /> {rating.average?.toFixed(1)} · {rating.count} reseña(s) verificadas</p> : null; })()}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {person.teaches.length === 0 && (
          <span className="text-sm text-muted-foreground">Aún no ofrece habilidades.</span>
        )}
        {person.teaches.map((s) => {
          const Icon = CATEGORY_ICON[s.category];
          return (
            <span
              key={s.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 text-sm font-medium"
            >
              <Icon className="size-4 text-brand" aria-hidden /> {s.name} {s.level && <span className="text-xs opacity-70">· {s.level}</span>}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex items-start gap-2 text-sm">
        <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">Disponibilidad:</p>
          <ul className="space-y-1 text-muted-foreground">
            {availabilityLines(person.availability).map((line) => (
              <li key={line}>{line}</li>
            ))}
            {person.availability.length === 0 && <li>Sin días disponibles</li>}
          </ul>
        </div>
      </div>
      <div className="mt-4">
        <Pill tone="mint" className="px-3 py-1.5 text-sm">
          <Coins className="size-4" aria-hidden /> Sesiones de 15 o 30 min
        </Pill>
      </div>
      <div className="mt-auto space-y-2 pt-5">
        <PublicProfileDialog person={person} state={state} />
        <RequestSessionDialog mentor={person} state={state} />
      </div>
    </article>
  );
}

function RescueCta() {
  return (
    <section aria-labelledby="atascaste" className="rounded-3xl bg-gradient-rescue p-6 shadow-card">
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-card text-brand shadow-card">
          <LifeBuoy className="size-8" strokeWidth={2.2} aria-hidden />
        </span>
        <div>
          <h2 id="atascaste" className="text-2xl font-bold">
            ¿Te atascaste?
          </h2>
          <p className="mt-1 text-sm text-foreground/80">
            Pide un rescate y recibe ayuda rápida de la comunidad.
          </p>
        </div>
      </div>
      <Button asChild variant="rescue" size="lg" className="mt-5 w-full">
        <Link to="/rescates">
          <Zap aria-hidden /> Pide un rescate
        </Link>
      </Button>
    </section>
  );
}

function BalanceCta({ state }: { state: DemoState }) {
  const available = availableOf(state, state.activeUserId);
  return (
    <section className="rounded-3xl bg-gradient-mint p-6 shadow-card">
      <div>
        <p className="font-display text-xl font-bold">Tu tiempo vale</p>
        <p className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <Coins className="size-7 text-mint-foreground" aria-hidden />
          {available} minutos
        </p>
        <p className="text-sm text-mint-foreground">disponibles para pedir ayuda</p>
      </div>
      <div className="mt-4">
        <TopupDialog />
      </div>
    </section>
  );
}

function NextSession({ state }: { state: DemoState }) {
  const me = state.activeUserId;
  const next = nextScheduledSession(state, me);
  const other = next
    ? state.profiles[next.learnerId === me ? next.mentorId : next.learnerId]
    : null;
  return (
    <section aria-labelledby="proxima" className="card-surface p-5">
      <h2 id="proxima" className="mb-3 flex items-center gap-2 text-lg font-bold">
        <CalendarDays className="size-5" aria-hidden /> Tu próxima sesión
      </h2>
      {next && other ? (
        <Link
          to="/intercambios"
          className="group flex items-center gap-3 rounded-xl p-1 hover:bg-brand-softer"
        >
          <UserAvatar userId={other.id} src={other.photoUrl} name={other.name} size="md" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{next.topic}</p>
            <p className="text-muted-foreground">
              con {other.name} · {next.minutes} min
            </p>
            {next.scheduledAt !== undefined && (
              <p className="mt-1 text-xs text-brand">
                {scheduledLabel(next.scheduledAt, state.profiles[me]?.timeZone)}
              </p>
            )}
          </div>
          <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
        </Link>
      ) : (
        <p className="text-sm text-muted-foreground">No tienes una próxima sesión programada.</p>
      )}
    </section>
  );
}
