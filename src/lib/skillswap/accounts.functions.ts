import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { applyAction, type Action } from "./engine";
import type { DemoState } from "./types";
import { normalizeStateAvailability } from "./availability";

export const readAccount = createServerFn({ method: "GET" }).handler(async () => {
  const { verifiedAccount } = await import("./accounts.server");
  const user = await verifiedAccount();
  return user ? { id: user.id, email: user.email } : null;
});

export const authenticate = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().max(80).optional(),
      signup: z.boolean(),
      origin: z.string().url(),
    }),
  )
  .handler(async ({ data }) => {
    const { accountClient, saveAccount } = await import("./accounts.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const origin = getRequest().headers.get("origin") ?? new URL(getRequest().url).origin;
    if (data.origin !== origin) return { ok: false, message: "Origen no válido." };
    const client = accountClient();
    const result = data.signup
      ? await client.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { name: data.name }, emailRedirectTo: origin },
        })
      : await client.auth.signInWithPassword({ email: data.email, password: data.password });
    if (result.error)
      return {
        ok: false,
        message: data.signup
          ? "No pudimos registrar la cuenta. Revisa los datos."
          : "Correo o contraseña incorrectos.",
      };
    if (result.data.session) saveAccount(result.data.session);
    return {
      ok: true,
      message: result.data.session
        ? "Sesión iniciada."
        : "Revisa tu correo para confirmar tu cuenta.",
      signedIn: Boolean(result.data.session),
    };
  });

export const adoptConfirmation = createServerFn({ method: "POST" })
  .inputValidator(z.object({ access: z.string(), refresh: z.string() }))
  .handler(async ({ data }) => {
    const { accountClient, saveAccount } = await import("./accounts.server");
    const client = accountClient();
    const result = await client.auth.setSession({
      access_token: data.access,
      refresh_token: data.refresh,
    });
    const verified = await client.auth.getUser(data.access);
    if (result.error || !result.data.session || !verified.data.user) return false;
    saveAccount(result.data.session);
    return true;
  });

export const logoutAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { clearAccount, accountClient } = await import("./accounts.server");
  const { getCookie } = await import("@tanstack/react-start/server");
  const access = getCookie("skillswap-access");
  if (access) {
    const client = accountClient();
    await client.auth.admin.signOut(access, "local");
  }
  clearAccount();
  return true;
});

export const readSharedState = createServerFn({ method: "GET" }).handler(async () => {
  const { verifiedAccount } = await import("./accounts.server");
  const user = await verifiedAccount();
  if (!user) throw new Error("Inicia sesión para continuar.");
  // Aggregate data is not directly readable. Verify identity before privileged
  // access, then project only public profiles, public rescues and OWN private rows.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("skillswap_state")
    .select("data")
    .eq("id", true)
    .single();
  if (error) throw new Error("No pudimos cargar tus datos.");
  const state = normalizeStateAvailability(data.data as unknown as DemoState);
  const { accountClient } = await import("./accounts.server");
  const permission = await accountClient().rpc("has_role", { _user_id: user.id, _role: "admin" });
  const isAdmin = !permission.error && permission.data === true;
  const ownSessionIds = new Set(
    state.sessions
      .filter((s) => s.learnerId === user.id || s.mentorId === user.id)
      .map((s) => s.id),
  );
  return {
    ...state,
    messages: (state.messages ?? []).filter((m) => ownSessionIds.has(m.sessionId)),
    notifications: (state.notifications ?? []).filter((n) => n.userId === user.id),
    activeUserId: user.id,
    profiles: Object.fromEntries(
      Object.values(state.profiles).map((p) => [
        p.id,
        {
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          bio: p.bio,
          photoUrl: p.photoUrl,
          portfolioUrl: p.portfolioUrl,
          githubUrl: p.githubUrl,
          teaches: p.teaches,
          learns: p.learns,
          availability: p.availability,
          timeZone: p.timeZone,
          blockedDates: p.blockedDates,
        },
      ]),
    ),
    busySlots: Object.fromEntries(
      Object.keys(state.profiles).map((id) => [
        id,
        state.sessions
          .filter(
            (s) =>
              s.status === "accepted" &&
              s.scheduledAt !== undefined &&
              (s.mentorId === id || s.learnerId === id) &&
              s.mentorId !== user.id &&
              s.learnerId !== user.id,
          )
          .flatMap((s) =>
            s.scheduledAt === undefined
              ? []
              : [{ start: s.scheduledAt, end: s.scheduledAt + s.minutes * 60000 }],
          ),
      ]),
    ),
    reviews: state.reviews ?? [],
    reports: (state.reports ?? []).filter((r) => isAdmin || r.authorId === user.id),
    moderationLog: isAdmin ? (state.moderationLog ?? []) : [],
    restrictions: isAdmin ? (state.restrictions ?? []) : [],
    onboarding: { [user.id]: state.onboarding?.[user.id] ?? { step: 0, completed: false } },
    presentation: undefined,
    communitySummary: isAdmin ? {
      users: Object.keys(state.profiles).length,
      sessions: state.sessions.length,
      completed: state.sessions.filter((s) => s.status === "completed").length,
      reportsOpen: (state.reports ?? []).filter((r) => r.status === "open").length,
    } : undefined,
    sessions: state.sessions.filter((s) => s.learnerId === user.id || s.mentorId === user.id),
    movements: state.movements.filter((m) => m.toId === user.id || m.fromId === user.id),
    drafts: {},
    requestDrafts: Object.fromEntries(
      Object.entries(state.requestDrafts ?? {}).filter(([id]) => id === user.id),
    ),
  };
});

export const syncSharedNotifications = createServerFn({ method: "POST" }).handler(async () => {
  const { verifiedAccount } = await import("./accounts.server");
  const user = await verifiedAccount();
  if (!user) return { ok: false, changed: false };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  for (let attempt = 0; attempt < 12; attempt++) {
    const row = await supabaseAdmin
      .from("skillswap_state")
      .select("data,revision")
      .eq("id", true)
      .single();
    if (row.error) return { ok: false, changed: false };
    const state = row.data.data as unknown as DemoState;
    const result = applyAction(state, { type: "syncNotifications", userId: user.id });
    if (!result.ok) return { ok: false, changed: false };
    if (result.state.notifications === state.notifications) return { ok: true, changed: false };
    const updated = await supabaseAdmin.rpc("skillswap_compare_swap", {
      expected: row.data.revision,
      replacement: JSON.parse(JSON.stringify(result.state)),
    });
    if (updated.error) return { ok: false, changed: false };
    if (updated.data) return { ok: true, changed: true };
  }
  return { ok: false, changed: false };
});

export const applySharedAction = createServerFn({ method: "POST" })
  .inputValidator((input: Action) => input)
  .handler(async ({ data }) => {
    const { verifiedAccount } = await import("./accounts.server");
    const user = await verifiedAccount();
    if (!user) return { ok: false, message: "Inicia sesión para continuar." };
    if (data.type === "adminFinishDemo")
      return { ok: false, message: "El cierre anticipado solo se aplica al libro demo aislado." };
    if (["setPresentation", "setDemoAdmin", "prepareScenario", "resetScenario", "demoFinishLocally"].includes(data.type))
      return { ok: false, message: "El modo presentación es exclusivo de la demo aislada." };
    if (data.type === "moderateReport" || data.type === "setUserRestriction") {
      const { accountClient } = await import("./accounts.server");
      const permission = await accountClient().rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (permission.error || permission.data !== true)
        return { ok: false, message: "La moderación requiere un administrador verificado." };
    }
    if (data.type === "switchUser" || data.type === "reset" || data.type.startsWith("test"))
      return { ok: false, message: "Acción exclusiva de la demo." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    for (let attempt = 0; attempt < 12; attempt++) {
      const row = await supabaseAdmin
        .from("skillswap_state")
        .select("data,revision")
        .eq("id", true)
        .single();
      if (row.error) return { ok: false, message: "No pudimos guardar el cambio." };
      const state = row.data.data as unknown as DemoState;
      let result;
      try {
        if (data.type === "requestSession" && data.scheduledAt === undefined)
          return { ok: false, message: "Selecciona la fecha y hora de la sesión." };
        result = applyAction({ ...state, busySlots: undefined }, { ...data, userId: user.id });
      } catch {
        return { ok: false, message: "Datos de solicitud no válidos." };
      }
      if (!result) return { ok: false, message: "Acción no válida." };
      if (!result.ok) return { ok: false, message: result.error };
      const updated = await supabaseAdmin.rpc("skillswap_compare_swap", {
        expected: row.data.revision,
        replacement: JSON.parse(JSON.stringify(result.state)),
      });
      if (updated.error) return { ok: false, message: "No pudimos guardar el cambio." };
      if (updated.data) return { ok: true, message: result.message };
      // Another transaction won: re-read and reapply all balance checks.
    }
    return { ok: false, message: "Hay otro cambio en curso. Intenta otra vez." };
  });
