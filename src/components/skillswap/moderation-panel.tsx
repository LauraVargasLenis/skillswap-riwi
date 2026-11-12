import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, CheckCircle2, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { readAdminAccess } from "@/lib/skillswap/admin.functions";
import { useApp } from "@/lib/skillswap/use-app";
import { profileOf } from "@/lib/skillswap/profile";

export function ModerationPanel() {
  const { state, act, real } = useApp();
  const adminLookup = useServerFn(readAdminAccess);
  const access = useQuery({ queryKey: ["admin-moderation-access"], queryFn: () => adminLookup(), enabled: real, staleTime: 30000, retry: false });
  const demoAdmin = !real && Boolean(state?.presentation?.enabled && state?.presentation?.adminEnabled);
  const canModerate = demoAdmin || (real && access.data?.admin === true);
  const [open, setOpen] = useState(false);
  const [resolutions, setResolutions] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  if (!state || !canModerate) return null;
  const reports = state.reports ?? [];
  const summary = state.communitySummary ?? {
    users: Object.keys(state.profiles).length,
    sessions: state.sessions.length,
    completed: state.sessions.filter((s) => s.status === "completed").length,
    reportsOpen: reports.filter((r) => r.status === "open").length,
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button size="sm" variant="outline"><Shield className="size-4" /> <span className="hidden sm:inline">Moderación</span><span className="sm:hidden sr-only">Moderación</span></Button></DialogTrigger>
    <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
      <DialogHeader><DialogTitle>Administración y confianza comunitaria</DialogTitle>
        <DialogDescription>{demoAdmin ? "Datos y decisiones ficticias. Solo se guardan en este navegador; no afectan cuentas reales." : "Panel exclusivo de administradores verificados en servidor."}</DialogDescription></DialogHeader>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[["Usuarios", summary.users], ["Sesiones", summary.sessions], ["Completadas", summary.completed], ["Reportes abiertos", summary.reportsOpen]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-brand-softer p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div>)}
      </div>
      <h3 className="text-base font-bold">Reportes y conflictos</h3>
      {reports.length === 0 && <p className="text-sm text-muted-foreground">No hay reportes registrados.</p>}
      <ul className="space-y-3">{reports.slice().reverse().map((report) => <li key={report.id} className="rounded-xl border border-border p-4 text-sm">
        <p className="flex flex-wrap items-center gap-2 font-semibold"><Flag className="size-4" /> {report.reason} · {profileOf(state, report.authorId).name} reportó a {profileOf(state, report.reportedId).name}</p>
        <p className="mt-2">{report.details}</p>
        <p className="mt-1 text-xs text-muted-foreground">Referencia: {report.sessionId} · {demoAdmin ? "Reporte demostrativo" : "Reporte comunitario"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-medium">{(state.restrictions ?? []).some((r) => r.targetId === report.reportedId && r.active) ? "Usuario restringido" : "Sin restricción activa"}</span>
          <Button size="sm" variant="outline" disabled={busy} onClick={async () => {
            setBusy(true);
            const currently = (state.restrictions ?? []).some((r) => r.targetId === report.reportedId && r.active);
            try { await act({ type: "setUserRestriction", userId: state.activeUserId, targetId: report.reportedId, active: !currently, reason: resolutions[report.id] || "Medida de moderación por incidencia reportada." }); } finally { setBusy(false); }
          }}>{(state.restrictions ?? []).some((r) => r.targetId === report.reportedId && r.active) ? "Retirar restricción" : "Restringir usuario"}</Button>
        </div>
        {report.status === "resolved" ? <p className="mt-3 flex gap-2 text-mint-foreground"><CheckCircle2 className="size-4" /> Decisión: {report.resolution}</p> :
          <div className="mt-3 space-y-2"><label className="block font-semibold" htmlFor={`resolution-${report.id}`}>Resolución administrativa</label>
            <textarea id={`resolution-${report.id}`} value={resolutions[report.id] ?? ""} onChange={(e) => setResolutions((prev) => ({ ...prev, [report.id]: e.target.value }))} placeholder="Explica la decisión y los pasos de seguimiento…" className="min-h-20 w-full rounded-lg border border-input bg-card p-2" maxLength={800} />
            <Button size="sm" disabled={busy || (resolutions[report.id] ?? "").trim().length < 8} onClick={async () => {
              setBusy(true);
              try { await act({ type: "moderateReport", userId: state.activeUserId, reportId: report.id, resolution: resolutions[report.id] ?? "" }); } finally { setBusy(false); }
            }}>Resolver y auditar</Button>
          </div>}
      </li>)}</ul>
      <h3 className="text-base font-bold">Historial de decisiones</h3>
      {(state.moderationLog ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Aún no se han tomado decisiones.</p> : <ul className="space-y-2">{(state.moderationLog ?? []).slice().reverse().map((entry) => <li className="border-l-2 border-brand pl-3 text-sm" key={entry.id}><strong>{entry.decision}</strong><span className="block text-muted-foreground">{new Date(entry.createdAt).toLocaleString("es-CO")}</span></li>)}</ul>}
    </DialogContent>
  </Dialog>;
}
