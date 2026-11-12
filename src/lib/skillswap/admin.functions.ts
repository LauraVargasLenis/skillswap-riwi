import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Read-only role projection used to show demo controls; every mutation checks again. */
export const readAdminAccess = createServerFn({ method: "GET" }).handler(async () => {
  const { verifiedAccount, accountClient } = await import("./accounts.server");
  const user = await verifiedAccount();
  if (!user) return { admin: false };
  const { data, error } = await accountClient().rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  return { admin: !error && data === true };
});

/**
 * Authorizes one isolated local-demo finish and records the administrator.
 * This endpoint never reads or writes the real aggregate or its minute ledger.
 */
export const authorizeDemoFinish = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sessionId: z.string().min(1).max(100), demo: z.literal(true) }))
  .handler(async ({ data }) => {
    const { verifiedAccount, accountClient } = await import("./accounts.server");
    const user = await verifiedAccount();
    if (!user) return { ok: false as const, message: "Inicia sesión con una cuenta autorizada." };
    const role = await accountClient().rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (role.error || role.data !== true)
      return {
        ok: false as const,
        message: "Solo un administrador autorizado puede finalizar la demo.",
      };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const audit = await supabaseAdmin
      .from("skillswap_demo_admin_audit")
      .insert({
        admin_id: user.id,
        session_id: data.sessionId,
        action: "early_finish_authorized",
        details: { demo: true, isolatedFromRealLedger: true },
      })
      .select("id,created_at")
      .single();
    if (audit.error)
      return { ok: false as const, message: "No pudimos registrar la autorización." };
    return {
      ok: true as const,
      adminId: user.id,
      auditId: audit.data.id,
      authorizedAt: audit.data.created_at,
      message: "Cierre demo autorizado y auditado.",
    };
  });
