import { useRef, useState } from "react";
import { FlaskConical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useApp } from "@/lib/skillswap/use-app";
import { useTesting } from "@/lib/skillswap/testing-context";
import { TEST_PACKAGES } from "@/lib/skillswap/topup-config";
import { availableOf } from "@/lib/skillswap/engine";

export const cop = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);

export function TopupDialog({ beforeTopup, onReturn }: { beforeTopup?: () => Promise<boolean>; onReturn?: () => void }) {
  const { state, act, real } = useApp();
  const { enter } = useTesting();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState(30);
  const [credited, setCredited] = useState<number | null>(null);
  const operation = useRef<string | null>(null);
  const locked = useRef(false);
  const packages = state?.testPackages ?? TEST_PACKAGES;
  const [prices, setPrices] = useState<number[]>(packages.map((p) => p.priceCop));
  const me = state?.activeUserId;
  async function recharge() {
    if (!me || real || locked.current || credited !== null) return;
    locked.current = true; setBusy(true);
    try {
      if (beforeTopup && !(await beforeTopup())) return;
      operation.current ??= crypto.randomUUID();
      if (await act({ type: "testTopup", userId: me, id: operation.current, minutes: selected })) setCredited(selected);
    } finally { locked.current = false; setBusy(false); }
  }
  return <Dialog open={open} onOpenChange={(next) => {
    setOpen(next);
    if (next) { operation.current = null; setCredited(null); setPrices(packages.map((p) => p.priceCop)); }
  }}>
    <DialogTrigger asChild><Button type="button" variant="outline" size="sm"><Plus aria-hidden />Recargar minutos</Button></DialogTrigger>
    <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle className="flex items-center gap-2"><FlaskConical aria-hidden />Recargar minutos · Prueba</DialogTitle><DialogDescription>Demo · Precios de referencia en pesos colombianos. Saldos e historial separados de las cuentas reales.</DialogDescription></DialogHeader>
      {real ? <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">{TEST_PACKAGES.map((p) => <div key={p.minutes} className="rounded-lg border border-border p-3 text-center"><strong className="block">{p.minutes} min</strong><span className="text-sm text-muted-foreground">{cop(p.priceCop)} COP</span></div>)}</div>
        <Button className="w-full" disabled={busy} onClick={async () => { setBusy(true); try { await enter("laura"); } finally { setBusy(false); } }}><FlaskConical aria-hidden />Entrar a la demo</Button>
        <p className="text-sm text-warning-foreground">Cobro real deshabilitado hasta configurar la pasarela y los precios definitivos.</p>
      </div> : <div className="space-y-4">
        <p className="rounded-lg bg-warning-soft p-3 text-sm font-semibold text-warning-foreground">Simulación · {me && state?.profiles[me]?.name} · Sin dinero real</p>
        <fieldset disabled={busy || credited !== null}><legend className="mb-2 text-sm font-semibold">Paquete de minutos</legend><div className="grid grid-cols-3 gap-2">{packages.map((p) => <label key={p.minutes} className={`cursor-pointer rounded-lg border p-3 text-center has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${selected === p.minutes ? "border-primary bg-brand-softer" : "border-border"}`}><input type="radio" name="paquete-recarga" aria-label={`${p.minutes} minutos`} checked={selected === p.minutes} onChange={() => { setSelected(p.minutes); operation.current = null; }} className="sr-only" /><strong className="block">{p.minutes} min</strong><span className="text-sm">{cop(p.priceCop)} COP</span></label>)}</div></fieldset>
        <Button type="button" className="w-full" disabled={busy || credited !== null} onClick={recharge}><Plus aria-hidden />Recargar</Button>
        <p className="text-sm text-muted-foreground">Recarga simbólica. No se realizará ningún cobro</p>
        {credited !== null && <p role="status" className="rounded-lg bg-mint-soft p-3 text-sm font-semibold text-mint-foreground">Recarga simbólica · +{credited} min. Guardada. Tienes {state && me ? availableOf(state, me) : 0} minutos disponibles para aprender.</p>}
        {onReturn && <Button type="button" variant="outline" className="w-full" disabled={credited === null || busy} onClick={() => { setOpen(false); onReturn(); }}>Volver y revisar solicitud</Button>}
        <details><summary className="cursor-pointer text-sm font-semibold">Configurar precios de ejemplo</summary><form className="mt-3 space-y-3" onSubmit={async (e) => { e.preventDefault(); if (!me || locked.current) return; locked.current = true; setBusy(true); try { await act({ type: "testConfigurePackages", userId: me, prices }); } finally { locked.current = false; setBusy(false); } }}>{packages.map((p, i) => <label key={p.minutes} className="flex items-center justify-between gap-3 text-sm">{p.minutes} min · COP<input aria-label={`Precio de ${p.minutes} minutos en COP`} type="number" min="1" max="10000000" required value={prices[i] ?? p.priceCop} onChange={(e) => setPrices((old) => old.map((v, j) => i === j ? Number(e.target.value) : v))} className="h-9 w-32 rounded-lg border border-input bg-card px-3" /></label>)}<Button type="submit" variant="outline" disabled={busy}>Guardar precios de prueba</Button></form></details>
        <p className="text-xs text-muted-foreground">Cobro real deshabilitado. Todas las recargas son simbólicas.</p>
      </div>}
    </DialogContent>
  </Dialog>;
}
