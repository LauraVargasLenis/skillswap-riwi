import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Clapperboard, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/skillswap/use-app";
import type { DemoScenario } from "@/lib/skillswap/types";

const SCENARIOS: { id: DemoScenario; title: string; next: string; path: "/" | "/perfil" | "/rescates" | "/intercambios" }[] = [
  { id: "agenda", title: "1 · Agenda inteligente", next: "Consulta las franjas distintas en Mi perfil. Desde Explorar, reserva una fecha y reprograma.", path: "/perfil" },
  { id: "chat", title: "2 · Chat y notificaciones", next: "Abre Mis intercambios como Laura. Cambia a Emmanuel para aceptar, chatear y ver el aviso.", path: "/intercambios" },
  { id: "reputation", title: "3 · Perfiles y reputación", next: "Revisa la sesión ya completada y su reseña verificada. Realiza otra para añadir una valoración.", path: "/perfil" },
  { id: "onboarding", title: "4 · Bienvenida guiada", next: "Configura el perfil activo paso a paso, guardando habilidades y disponibilidad. Antes de preparar, selecciona qué perfil quieres mostrar.", path: "/perfil" },
  { id: "matching", title: "5 · Recomendaciones inteligentes", next: "En Explorar, Laura verá a Juan Daniel recomendado por inglés. Cambia de perfil para comparar.", path: "/" },
  { id: "impact", title: "6 · Gamificación e impacto", next: "Muestra el progreso de Emmanuel y demuestra cómo otra sesión suma logros.", path: "/perfil" },
  { id: "moderation", title: "7 · Administración comunitaria", next: "Activa Administrador demo y resuelve el reporte ficticio desde Moderación.", path: "/intercambios" },
  { id: "rescues", title: "8 · Rescates inteligentes", next: "Filtra las ayudas compatibles, acepta un rescate y ciérralo con confirmación bilateral.", path: "/rescates" },
];

export function PresentationControl() {
  const { state, testing, act } = useApp();
  if (!testing || !state) return null;
  const presentation = state.presentation;
  if (!presentation?.enabled) return (
    <Button size="sm" variant="outline" onClick={() => void act({ type: "setPresentation", enabled: true })}>
      <Clapperboard className="size-4" aria-hidden /> Modo presentación
    </Button>
  );
  return <Button size="sm" variant="outline" onClick={() => void act({ type: "setPresentation", enabled: false })}>
    Salir de presentación
  </Button>;
}

export function PresentationPanel() {
  const { state, testing, act } = useApp();
  const [choice, setChoice] = useState<DemoScenario>("agenda");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (state?.presentation?.scenario) setChoice(state.presentation.scenario); }, [state?.presentation?.scenario]);
  if (!testing || !state?.presentation?.enabled) return null;
  const p = state.presentation;
  const selected = SCENARIOS.find((s) => s.id === choice) ?? SCENARIOS[0]!;
  const active = SCENARIOS.find((s) => s.id === p.scenario);
  async function perform(type: "prepareScenario" | "resetScenario") {
    if (busy) return;
    if (type === "resetScenario" && !window.confirm(`¿Reiniciar únicamente el escenario «${selected.title}»?`)) return;
    setBusy(true);
    try { await act({ type, scenario: choice }); } finally { setBusy(false); }
  }
  return (
    <section aria-label="Panel de presentación" className="border-b border-brand/20 bg-brand-softer px-4 py-3 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-brand"><Clapperboard className="size-4" aria-hidden /> Panel de presentación · Solo demo local</p>
          <Button size="sm" variant="ghost" aria-expanded={!p.collapsed} onClick={() => void act({ type: "setPresentation", enabled: true, collapsed: !p.collapsed })}>
            {p.collapsed ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />} {p.collapsed ? "Expandir" : "Contraer"}
          </Button>
        </div>
        {!p.collapsed && <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="space-y-2">
            <label className="block text-xs font-semibold" htmlFor="scenario-choice">Escenario a demostrar</label>
            <select id="scenario-choice" value={choice} onChange={(e) => setChoice(e.target.value as DemoScenario)} className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm">
              {SCENARIOS.map((s) => <option value={s.id} key={s.id}>{s.title}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Perfil: <strong>{state.profiles[state.activeUserId]?.name}</strong> · Preparado: {active?.title ?? "ninguno"}</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Acción siguiente sugerida</p>
            <p className="mt-1 text-muted-foreground">{active?.next ?? selected.next}</p>
            <Link to={active?.path ?? selected.path} className="text-sm font-semibold text-brand underline">Ir a la funcionalidad</Link>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Button size="sm" disabled={busy} onClick={() => void perform("prepareScenario")}>{busy ? "Preparando…" : "Preparar demostración"}</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void perform("resetScenario")}><RotateCcw className="size-4" /> Reiniciar escenario</Button>
          </div>
          <label className="md:col-span-2 lg:col-span-3 flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={Boolean(p.adminEnabled)} onChange={(e) => void act({ type: "setDemoAdmin", enabled: e.target.checked })} className="size-4 accent-primary" />
            <ShieldCheck className="size-4 text-brand" aria-hidden /> Administrador demo (solo acciones simuladas, sin permisos de servidor)
          </label>
        </div>}
      </div>
    </section>
  );
}
