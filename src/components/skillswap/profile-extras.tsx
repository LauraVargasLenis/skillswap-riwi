import { useState, type ChangeEvent } from "react";
import { Star, Medal, Award, ImagePlus, Compass, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityEditor } from "@/components/skillswap/availability-editor";
import { impactOf, recommendationsFor } from "@/lib/skillswap/insights";
import { useApp } from "@/lib/skillswap/use-app";
import { CATEGORIES, type Category, type Profile, type Skill, type Availability } from "@/lib/skillswap/types";
import { DEFAULT_TIME_ZONE } from "@/lib/skillswap/time";

const input = "h-10 w-full rounded-xl border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ProfileExtras({ profile }: { profile: Profile }) {
  const { act, state } = useApp();
  const [bio, setBio] = useState(profile.bio ?? "");
  const [tagline, setTagline] = useState(profile.tagline);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(profile.portfolioUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl ?? "");
  const [levels, setLevels] = useState<Record<string, "Inicial" | "Intermedio" | "Avanzado">>(Object.fromEntries(profile.teaches.map((s) => [s.id, s.level ?? "Inicial"])));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(["image/png", "image/jpeg", "image/webp"].includes(file.type)) || file.size > 150000) {
      setError("Elige una imagen JPG, PNG o WebP de hasta 150 KB."); return;
    }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") { setPhotoUrl(reader.result); setError(""); } };
    reader.onerror = () => setError("No pudimos leer la imagen.");
    reader.readAsDataURL(file);
  }
  if (!state) return null;
  return <section className="card-surface p-6" aria-labelledby="datos-extendidos">
    <h2 id="datos-extendidos" className="text-xl font-bold">Presentación y experiencia</h2>
    <p className="mt-1 mb-4 text-sm text-muted-foreground">Personaliza los datos públicos que ven quienes quieren aprender contigo.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold sm:col-span-2">Descripción breve
        <input className={`${input} mt-1`} value={tagline} maxLength={100} onChange={(e) => setTagline(e.target.value)} />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">Biografía
        <textarea className="mt-1 min-h-24 w-full rounded-xl border border-input bg-card p-3 font-normal" value={bio} maxLength={700} onChange={(e) => setBio(e.target.value)} placeholder="Cuéntanos sobre tu experiencia y cómo puedes ayudar…" />
      </label>
      <label className="text-sm font-semibold">Portafolio (opcional)
        <input className={`${input} mt-1`} type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://miportafolio.com" />
      </label>
      <label className="text-sm font-semibold">GitHub (opcional)
        <input className={`${input} mt-1`} type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/usuario" />
      </label>
      <label className="text-sm font-semibold sm:col-span-2"><span className="flex items-center gap-2"><ImagePlus className="size-4" /> Fotografía personal (máximo 150 KB)</span>
        <input className="mt-1 block w-full text-sm font-normal" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void upload(e)} />
      </label>
      {photoUrl && <div className="flex items-center gap-3 sm:col-span-2"><img src={photoUrl} alt="Vista previa de foto" className="size-16 rounded-full object-cover" /><Button type="button" size="sm" variant="outline" onClick={() => setPhotoUrl("")}>Quitar foto personalizada</Button></div>}
      <fieldset className="sm:col-span-2"><legend className="mb-2 font-bold">Nivel de experiencia por habilidad</legend>
        <div className="grid gap-3 sm:grid-cols-2">{profile.teaches.map((skill) => <label className="text-sm" key={skill.id}>{skill.name}
          <select className={`${input} mt-1`} value={levels[skill.id] ?? skill.level ?? "Inicial"} onChange={(e) => setLevels({ ...levels, [skill.id]: e.target.value as "Inicial" | "Intermedio" | "Avanzado" })}>
            <option>Inicial</option><option>Intermedio</option><option>Avanzado</option>
          </select>
        </label>)}</div>
      </fieldset>
    </div>
    {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
    <Button className="mt-5" disabled={saving} onClick={async () => {
      setSaving(true);
      try { const ok = await act({ type: "updateProfileDetails", userId: profile.id, bio, tagline, photoUrl, portfolioUrl, githubUrl, levels }); if (ok) setError(""); }
      finally { setSaving(false); }
    }}>{saving ? "Guardando…" : "Guardar presentación"}</Button>
  </section>;
}

export function ImpactPanel() {
  const { state } = useApp();
  if (!state) return null;
  const userId = state.activeUserId;
  const impact = impactOf(state, userId);
  const reviews = (state.reviews ?? []).filter((r) => r.targetId === userId);
  return <section className="card-surface p-6" aria-labelledby="impact-title">
    <h2 id="impact-title" className="flex items-center gap-2 text-xl font-bold"><Medal className="size-5 text-brand" /> Mi impacto en SkillSwap</h2>
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {[["Minutos enseñados", `${impact.taught} min`], ["Minutos aprendidos", `${impact.learned} min`], ["Sesiones completas", impact.completed], ["Personas ayudadas", impact.helped], ["Valoración promedio", impact.average === null ? "Sin valoraciones" : `${impact.average.toFixed(1)} / 5`], ["Reseñas verificadas", impact.reviewCount]].map(([name, value]) => <div key={String(name)} className="rounded-xl bg-brand-softer p-3"><dt className="text-xs text-muted-foreground">{name}</dt><dd className="mt-1 text-lg font-bold">{value}</dd></div>)}
    </dl>
    <h3 className="mt-5 font-bold">Insignias ganadas</h3>
    {impact.badges.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Completa tu primera sesión para desbloquear una insignia.</p> : <div className="mt-2 flex flex-wrap gap-2">{impact.badges.map((badge) => <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-3 py-1.5 text-sm font-semibold" key={badge}><Award className="size-4" /> {badge}</span>)}</div>}
    <h3 className="mt-5 font-bold">Lo que dice la comunidad</h3>
    {reviews.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Aún no recibes reseñas verificadas.</p> : <ul className="mt-2 space-y-3">{reviews.slice().reverse().map((r) => <li className="rounded-xl border border-border p-3 text-sm" key={r.id}><p className="flex items-center gap-1 font-bold"><Star className="size-4 fill-current text-brand" /> {r.rating}/5 · {state.profiles[r.authorId]?.name ?? "Participante"}</p><p className="mt-1">{r.comment}</p><p className="mt-1 text-xs text-muted-foreground">Sesión completada · Reseña verificada</p></li>)}</ul>}
  </section>;
}

/** The same pure engine actions persist onboarding for real accounts and the local demo. */
export function OnboardingWizard() {
  const { state, act, real } = useApp();
  const me = state?.profiles[state.activeUserId];
  const progress = me ? state?.onboarding?.[me.id] : undefined;
  const [teach, setTeach] = useState("");
  const [category, setCategory] = useState<Category>("Programación");
  const [learn, setLearn] = useState("");
  const [slots, setSlots] = useState<Availability>([]);
  const [blockedDates, setBlockedDates] = useState<string[] | null>(null);
  const [zone, setZone] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  if (!state || !me || progress?.completed || (!real && state.presentation?.scenario !== "onboarding")) return null;
  const step = progress?.step ?? 0;
  const recommendations = recommendationsFor(state, me.id);
  async function advance() {
    if (saving) return;
    setSaving(true); setError("");
    try {
      let teaches = me.teaches;
      let learns = me.learns;
      let availability = me.availability;
      if (step === 1) {
        if (!teach.trim() && !teaches.length) { setError("Añade una habilidad que puedas enseñar."); return; }
        if (teach.trim()) teaches = [...teaches, { id: `sk-welcome-${Date.now()}`, name: teach.trim(), category, level: "Inicial" } satisfies Skill];
      }
      if (step === 2) {
        if (!learn.trim() && !learns.length) { setError("Añade algo que quieras aprender."); return; }
        if (learn.trim() && !learns.includes(learn.trim())) learns = [...learns, learn.trim()];
      }
      if (step === 3) {
        availability = slots.length ? slots : me.availability;
        if (!availability.length) { setError("Selecciona al menos una franja disponible."); return; }
      }
      if (step >= 1 && step <= 3) {
        const ok = await act({ type: "updateProfile", userId: me.id, teaches, learns, availability, timeZone: step === 3 ? (zone ?? me.timeZone ?? DEFAULT_TIME_ZONE) : (me.timeZone ?? DEFAULT_TIME_ZONE), blockedDates: step === 3 ? (blockedDates ?? me.blockedDates) : me.blockedDates });
        if (!ok) { setError("No se guardaron los datos. Corrige la información e inténtalo de nuevo."); return; }
      }
      await act({ type: "saveOnboarding", userId: me.id, step: step + 1, completed: step === 4 });
    } finally { setSaving(false); }
  }
  return <section className="mb-8 rounded-3xl border-2 border-brand bg-brand-softer p-5 sm:p-6" aria-labelledby="onboarding-title">
    <p className="text-xs font-bold uppercase tracking-wider text-brand">Bienvenida · Paso {step + 1} de 5</p>
    <div className="mt-2 flex gap-1" aria-label={`Progreso: paso ${step + 1} de 5`}>{Array.from({ length: 5 }, (_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-border"}`} />)}</div>
    <h2 id="onboarding-title" className="mt-4 text-xl font-bold">{["¡Bienvenido a SkillSwap!", "¿Qué puedes enseñar?", "¿Qué quieres aprender?", "¿Cuándo estás disponible?", "Descubre tus coincidencias"][step] ?? "Tu bienvenida"}</h2>
    {step === 0 && <p className="mt-2 text-sm">Aprende con otras personas, comparte lo que sabes y gana minutos al enseñar. Las sesiones solo se liquidan cuando ambos participantes confirman.</p>}
    {step === 1 && <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-sm">Habilidad que enseñas<input className={`${input} mt-1`} value={teach} onChange={(e) => setTeach(e.target.value)} placeholder="Ej.: JavaScript" /></label><label className="text-sm">Categoría<select className={`${input} mt-1`} value={category} onChange={(e) => setCategory(e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label><p className="text-xs text-muted-foreground sm:col-span-2">Actuales: {me.teaches.map((s) => s.name).join(", ") || "ninguna"}</p></div>}
    {step === 2 && <label className="mt-3 block text-sm">Conocimiento que quieres adquirir<input className={`${input} mt-1`} value={learn} onChange={(e) => setLearn(e.target.value)} placeholder="Ej.: Python" /><span className="mt-2 block text-xs text-muted-foreground">Actuales: {me.learns.join(", ") || "ninguno"}</span></label>}
    {step === 3 && <div className="mt-3"><AvailabilityEditor slots={slots.length ? slots : me.availability} onChange={setSlots} blockedDates={blockedDates ?? me.blockedDates ?? []} onBlockedDatesChange={setBlockedDates} timeZone={zone ?? me.timeZone ?? DEFAULT_TIME_ZONE} onTimeZoneChange={setZone} error={error || null} /></div>}
    {step === 4 && <div className="mt-3 space-y-2">{recommendations.length ? recommendations.slice(0, 3).map((r) => <p className="flex items-start gap-2 rounded-lg bg-card p-3 text-sm" key={r.person.id}><Compass className="mt-0.5 size-4 text-brand" /><span><strong>{r.person.name}</strong> · {r.reasons.join(" · ")}</span></p>) : <p className="text-sm">Completa tus intereses para encontrar personas compatibles.</p>}</div>}
    {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
    <Button className="mt-4" disabled={saving} onClick={() => void advance()}>{saving ? "Guardando…" : step === 4 ? <><CheckCircle2 className="size-4" /> Finalizar bienvenida</> : "Guardar y continuar"}</Button>
  </section>;
}
