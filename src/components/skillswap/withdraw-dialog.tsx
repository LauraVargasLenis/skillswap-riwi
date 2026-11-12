import { useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { earnedAvailableOf } from "@/lib/skillswap/engine";
import { useApp } from "@/lib/skillswap/use-app";
import { cop } from "./topup-dialog";

export function WithdrawDialog() {
  const { state, act, real } = useApp();
  const [open, setOpen] = useState(false);
  const [blocks, setBlocks] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const operation = useRef<string | null>(null);
  const locked = useRef(false);
  if (!state || real) return null;
  const me = state.activeUserId;
  const earned = earnedAvailableOf(state, me);
  const minutes = blocks * 60;
  const price = blocks * 16000;
  async function confirm() {
    if (locked.current || done) return;
    locked.current = true; setBusy(true);
    operation.current ??= crypto.randomUUID();
    try { if (await act({ type: "testWithdraw", userId: me, blocks, id: operation.current })) setDone(true); }
    finally { locked.current = false; setBusy(false); }
  }
  return <div className="space-y-2">
    <p className="text-sm font-semibold">60 minutos ganados = $16.000 COP</p>
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) { setBlocks(1); setDone(false); operation.current = null; } }}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><ArrowUpRight aria-hidden />Retirar</Button></DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Retiro simbólico</DialogTitle><DialogDescription>Simulación · Sin transferencia de dinero real</DialogDescription></DialogHeader>
        <p className="text-sm">Tienes <strong>{earned} minutos ganados disponibles para retiro</strong>.</p>
        {!done && <>
          <label className="space-y-2 text-sm font-semibold">Bloques de 60 minutos
            <input aria-label="Bloques de 60 minutos" type="number" min="1" max={Math.max(1, Math.floor(earned / 60))} step="1" value={blocks} disabled={busy} onChange={(e) => { setBlocks(Math.max(1, Math.floor(Number(e.target.value) || 1))); operation.current = null; }} className="mt-2 h-11 w-full rounded-lg border border-input bg-card px-3" />
          </label>
          <p className="rounded-lg bg-brand-softer p-3 text-sm">Se descontarán <strong>{minutes} min ganados</strong>. Importe simulado: <strong>{cop(price)} COP</strong>.</p>
          {earned < minutes && <p role="status" className="text-sm text-warning-foreground">Te faltan {minutes - earned} minutos ganados sin reservar para retirar {minutes} min.</p>}
          <Button disabled={busy || earned < minutes} onClick={confirm}>Confirmar retiro simbólico</Button>
        </>}
        {done && <p role="status" className="rounded-lg bg-mint-soft p-3 text-sm font-semibold text-mint-foreground">Retiro simbólico guardado · −{minutes} min · {cop(price)} COP. Sin transferencia de dinero real.</p>}
        <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>{done ? "Cerrar" : "Cancelar"}</Button>
      </DialogContent>
    </Dialog>
    {earned < 60 && <p className="text-sm text-warning-foreground">Te faltan {60 - earned} minutos ganados disponibles para retirar un bloque.</p>}
  </div>;
}