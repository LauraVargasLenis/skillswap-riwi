import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authorizeDemoFinish, readAdminAccess } from "@/lib/skillswap/admin.functions";
import { useAccount } from "@/lib/skillswap/account-context";
import type { DemoState, Session } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";

export function AdminDemoFinish({ session, state }: { session: Session; state: DemoState }) {
  const account = useAccount();
  const { act } = useApp();
  const readAccess = useServerFn(readAdminAccess);
  const authorize = useServerFn(authorizeDemoFinish);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const simulated = Boolean(state.testing && state.presentation?.enabled && state.presentation.adminEnabled && session.demo && session.status === "accepted" && !session.earlyDemo);
  const enabled = Boolean(
    account.real &&
    state.testing &&
    session.demo &&
    session.status === "accepted" &&
    !session.earlyDemo,
  );
  const access = useQuery({
    queryKey: ["admin-access", account.account?.id],
    queryFn: () => readAccess(),
    enabled: enabled && !simulated,
    staleTime: 30_000,
    retry: false,
  });
  if (!simulated && (!enabled || access.data?.admin !== true)) return null;

  async function finish() {
    if (busy) return;
    setBusy(true);
    if (simulated) {
      const ok = await act({ type: "demoFinishLocally", userId: state.activeUserId, sessionId: session.id });
      if (ok) setOpen(false);
      setBusy(false);
      return;
    }
    const permission = await authorize({ data: { sessionId: session.id, demo: true } });
    if (!permission.ok) {
      toast.error(permission.message);
      setBusy(false);
      return;
    }
    const ok = await act({
      type: "adminFinishDemo",
      userId: permission.adminId,
      sessionId: session.id,
      auditId: permission.auditId,
    });
    if (ok) setOpen(false);
    setBusy(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" disabled={busy}>
          <Flag aria-hidden /> Finalizar ahora (demo)
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ¿Deseas finalizar anticipadamente esta asesoría de demostración?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción permitirá mostrar el proceso de confirmación y cierre sin esperar el tiempo
            programado. {simulated ? "Solo modifica esta demo local, sin permisos ni registros reales." : "Solo cambia la demo aislada y registra al administrador autorizado."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Volver</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void finish();
            }}
          >
            {busy ? "Registrando…" : "Finalizar asesoría demo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
