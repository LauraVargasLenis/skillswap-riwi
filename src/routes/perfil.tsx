import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarDays, GraduationCap, Plus, Save, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent } from "react";

import { UserAvatar } from "@/components/skillswap/avatar";
import { PageHeader, PageSkeleton, Pill } from "@/components/skillswap/bits";
import { Button } from "@/components/ui/button";
import { availabilityError, availableOf } from "@/lib/skillswap/engine";
import { formatAvailability } from "@/lib/skillswap/format";
import {
  CATEGORIES,
  type Availability,
  type Category,
  type Profile,
  type Skill,
} from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { AvailabilityEditor } from "@/components/skillswap/availability-editor";
import { DEFAULT_TIME_ZONE } from "@/lib/skillswap/time";
import { ProfileExtras, ImpactPanel, OnboardingWizard } from "@/components/skillswap/profile-extras";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Mi perfil — SkillSwap" },
      {
        name: "description",
        content: "Edita qué enseñas, qué quieres aprender y cuándo estás disponible.",
      },
      { property: "og:title", content: "Mi perfil — SkillSwap" },
      {
        property: "og:description",
        content: "Edita qué enseñas, qué quieres aprender y cuándo estás disponible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { state, me } = useApp();
  if (!state || !me) return <PageSkeleton />;
  return (
    <div className="animate-pop-in">
      <PageHeader title="Mi perfil" subtitle="Así te ve la comunidad en Explorar." />
      <OnboardingWizard key={`welcome-${me.id}`} />
      <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="card-surface h-fit p-6 text-center lg:sticky lg:top-24">
          <UserAvatar
            userId={me.id}
            name={me.name}
            size="xl"
            className="mx-auto ring-4 ring-brand-softer"
            src={me.photoUrl}
          />
          <h2 className="mt-4 text-2xl font-bold">{me.name}</h2>
          <p className="text-sm text-muted-foreground">{me.tagline}</p>
          <div className="mt-4">
            <Pill tone="mint" className="px-3 py-1.5 text-sm">
              {availableOf(state, me.id)} min disponibles
            </Pill>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {formatAvailability(me.availability)}
          </p>
        </aside>
        <div className="min-w-0 space-y-6">
          <ProfileExtras key={`extras-${me.id}`} profile={me} />
          <ImpactPanel />
          <ProfileForm key={me.id} profile={me} />
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ProfileForm({ profile }: { profile: Profile }) {
  const { act } = useApp();
  const [teaches, setTeaches] = useState<Skill[]>(profile.teaches);
  const [learns, setLearns] = useState<string[]>(profile.learns);
  const [newLearn, setNewLearn] = useState("");
  const [slots, setSlots] = useState<Availability>(profile.availability);
  const [blockedDates, setBlockedDates] = useState(profile.blockedDates ?? []);
  const [timeZone, setTimeZone] = useState(profile.timeZone ?? DEFAULT_TIME_ZONE);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateSkill(id: string, patch: Partial<Skill>) {
    setTeaches((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function addLearn() {
    const v = newLearn.trim();
    if (!v || learns.some((l) => l.toLowerCase() === v.toLowerCase())) return;
    setLearns([...learns, v]);
    setNewLearn("");
  }
  function onLearnKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addLearn();
    }
  }
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = availabilityError(slots);
    setError(validation);
    if (validation) return;
    setSaving(true);
    try {
      await act({
        type: "updateProfile",
        userId: profile.id,
        teaches,
        learns,
        availability: slots,
        blockedDates,
        timeZone,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="min-w-0 space-y-6">
      <fieldset className="card-surface p-6">
        <legend className="sr-only">Qué enseño</legend>
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold" aria-hidden>
          <BookOpen className="size-5 text-brand" /> Qué enseño
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Lo que otras personas pueden pedirte en una sesión.
        </p>
        <ul className="space-y-3">
          {teaches.map((s, i) => (
            <li key={s.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
              <div>
                <label htmlFor={`sk-name-${s.id}`} className="sr-only">
                  Habilidad {i + 1}
                </label>
                <input
                  id={`sk-name-${s.id}`}
                  value={s.name}
                  onChange={(e) => updateSkill(s.id, { name: e.target.value })}
                  placeholder="Ej.: JavaScript básico"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor={`sk-cat-${s.id}`} className="sr-only">
                  Categoría de la habilidad {i + 1}
                </label>
                <select
                  id={`sk-cat-${s.id}`}
                  value={s.category}
                  onChange={(e) => updateSkill(s.id, { category: e.target.value as Category })}
                  className={inputCls}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Quitar ${s.name || "habilidad"}`}
                onClick={() => setTeaches(teaches.filter((x) => x.id !== s.id))}
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() =>
            setTeaches([...teaches, { id: `sk-${Date.now()}`, name: "", category: "Programación" }])
          }
        >
          <Plus aria-hidden /> Agregar habilidad
        </Button>
      </fieldset>

      <fieldset className="card-surface p-6">
        <legend className="sr-only">Qué quiero aprender</legend>
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold" aria-hidden>
          <GraduationCap className="size-5 text-brand" /> Qué quiero aprender
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Temas en los que te gustaría recibir ayuda.
        </p>
        <ul className="mb-4 flex flex-wrap gap-2" aria-label="Temas que quiero aprender">
          {learns.length === 0 && (
            <li className="text-sm text-muted-foreground">Aún no agregas temas.</li>
          )}
          {learns.map((l) => (
            <li
              key={l}
              className="inline-flex items-center gap-1 rounded-full bg-mint-soft py-1 pl-3 pr-1 text-sm font-medium text-mint-foreground"
            >
              {l}
              <button
                type="button"
                aria-label={`Quitar ${l}`}
                onClick={() => setLearns(learns.filter((x) => x !== l))}
                className="grid size-6 place-items-center rounded-full hover:bg-mint/30"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <label htmlFor="nuevo-tema" className="sr-only">
            Nuevo tema
          </label>
          <input
            id="nuevo-tema"
            value={newLearn}
            onChange={(e) => setNewLearn(e.target.value)}
            onKeyDown={onLearnKey}
            placeholder="Ej.: Git y GitHub"
            className={inputCls}
          />
          <Button type="button" variant="secondary" onClick={addLearn}>
            <Plus aria-hidden /> Agregar
          </Button>
        </div>
      </fieldset>

      <fieldset className="card-surface p-6">
        <legend className="sr-only">Cuándo estoy disponible</legend>
        <h2 className="mb-1 flex items-center gap-2 text-xl font-bold" aria-hidden>
          <CalendarDays className="size-5 text-brand" /> Cuándo estoy disponible
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Cuándo puedes dar sesiones a la comunidad.
        </p>
        <AvailabilityEditor
          slots={slots}
          onChange={(value) => {
            setSlots(value);
            setError(null);
          }}
          blockedDates={blockedDates}
          onBlockedDatesChange={setBlockedDates}
          timeZone={timeZone}
          onTimeZoneChange={setTimeZone}
          error={error}
        />
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          <Save aria-hidden /> {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
