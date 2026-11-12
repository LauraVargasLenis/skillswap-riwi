import { profileOf } from "@/lib/skillswap/profile";
import { createSeed } from "./seed";
import { rescueRelevance } from "./insights";
import { normalizeStateAvailability } from "./availability";
import { DAY_LONG, WEEK_ORDER } from "./format";
import { TEST_PACKAGES } from "./topup-config";
import {
  dateDay,
  DEFAULT_TIME_ZONE,
  localInstant,
  localParts,
  validDate,
  validTimeZone,
} from "./time";
import {
  CATEGORIES,
  DURATIONS,
  type Availability,
  type Category,
  type DemoState,
  type Duration,
  type Profile,
  type Rescue,
  type Session,
  type SkillNotification,
  type UserId,
  type DemoScenario,
  type OnboardingProgress,
} from "./types";

/* ---------- Balances ---------- */

/** Minutes the user owns: everything received minus everything sent. */
export function balanceOf(state: DemoState, userId: UserId): number {
  return state.movements.reduce((sum, m) => {
    if (m.toId === userId) sum += m.minutes;
    if (m.fromId === userId) sum -= m.minutes;
    return sum;
  }, 0);
}

/** Minutes held for accepted sessions where the user is the one receiving help. */
export function reservedOf(state: DemoState, userId: UserId): number {
  return state.sessions
    .filter((s) => s.status === "accepted" && s.learnerId === userId)
    .reduce((sum, s) => sum + s.minutes, 0);
}

export function availableOf(state: DemoState, userId: UserId): number {
  return balanceOf(state, userId) - reservedOf(state, userId);
}

/** Replay the ledger; legacy transfers consume promotional minutes first. */
function sourceBalance(state: DemoState, userId: UserId) {
  let regular = 0;
  let earned = 0;
  for (const m of state.movements) {
    if (m.toId === userId) {
      if (m.kind === "session" || m.kind === "earned") earned += m.minutes;
      else regular += m.minutes;
    }
    if (m.fromId === userId) {
      const debit =
        m.spentSources ??
        (m.kind === "withdrawal"
          ? { regular: 0, earned: m.minutes }
          : { regular: Math.min(regular, m.minutes), earned: Math.max(0, m.minutes - regular) });
      regular -= debit.regular;
      earned -= debit.earned;
    }
  }
  return { regular, earned };
}

export function availableSources(state: DemoState, userId: UserId) {
  const pools = sourceBalance(state, userId);
  for (const s of state.sessions
    .filter((s) => s.learnerId === userId && s.status === "accepted")
    .slice()
    .sort((a, b) => (a.acceptedAt ?? a.createdAt) - (b.acceptedAt ?? b.createdAt))) {
    const held = s.reservedSources ?? {
      regular: Math.min(pools.regular, s.minutes),
      earned: Math.max(0, s.minutes - pools.regular),
    };
    pools.regular -= held.regular;
    pools.earned -= held.earned;
  }
  return pools;
}

export const earnedAvailableOf = (state: DemoState, userId: UserId) =>
  availableSources(state, userId).earned;
function reserveSources(state: DemoState, userId: UserId, minutes: number) {
  const pools = availableSources(state, userId);
  return {
    regular: Math.min(pools.regular, minutes),
    earned: Math.max(0, minutes - pools.regular),
  };
}

/* ---------- Actions ---------- */

export type Action =
  | { type: "testTopup"; userId: UserId; minutes: number; id: string }
  | { type: "testWithdraw"; userId: UserId; blocks: number; id: string }
  | { type: "testCreateTopup"; userId: UserId; minutes: number; id: string }
  | { type: "testResolveTopup"; userId: UserId; id: string; approved: boolean }
  | { type: "testConfigurePackages"; userId: UserId; prices: number[] }
  | {
      type: "testSaveDraft" | "saveRequestDraft";
      userId: UserId;
      mentorId: UserId;
      topic: string;
      minutes: Duration;
      note: string;
      scheduledAt?: number | undefined;
      timeZone?: string;
    }
  | {
      type: "proposeReschedule";
      userId: UserId;
      sessionId: string;
      scheduledAt: number;
      timeZone: string;
    }
  | { type: "respondReschedule"; userId: UserId; sessionId: string; accept: boolean }
  | { type: "startAttention" | "endAttention"; userId: UserId; sessionId: string }
  | { type: "sendMessage"; userId: UserId; sessionId: string; body: string; clientId: string }
  | { type: "markNotificationRead"; userId: UserId; notificationId: string }
  | { type: "markAllNotificationsRead"; userId: UserId }
  | { type: "syncNotifications"; userId: UserId }
  | { type: "adminFinishDemo"; userId: UserId; sessionId: string; auditId: string }
  | { type: "switchUser"; userId: UserId }
  | { type: "setPresentation"; enabled: boolean; collapsed?: boolean }
  | { type: "setDemoAdmin"; enabled: boolean }
  | { type: "prepareScenario" | "resetScenario"; scenario: DemoScenario }
  | { type: "demoFinishLocally"; sessionId: string; userId: UserId }
  | { type: "updateProfileDetails"; userId: UserId; bio: string; tagline: string; photoUrl: string; portfolioUrl: string; githubUrl: string; levels: Record<string, "Inicial" | "Intermedio" | "Avanzado"> }
  | { type: "submitReview"; userId: UserId; sessionId: string; rating: number; comment: string }
  | { type: "saveOnboarding"; userId: UserId; step: number; completed: boolean }
  | { type: "reportSession"; userId: UserId; sessionId: string; reason: "conducta" | "inasistencia" | "incumplimiento" | "otro"; details: string }
  | { type: "moderateReport"; userId: UserId; reportId: string; resolution: string }
  | { type: "setUserRestriction"; userId: UserId; targetId: UserId; active: boolean; reason: string }

  | {
      type: "publishRescue";
      userId: UserId;
      title: string;
      description: string;
      category: Category;
      minutes: number;
      timing?: "immediate" | "scheduled";
    }
  | { type: "withdrawRescue"; userId: UserId; rescueId: string }
  | { type: "acceptRescue"; userId: UserId; rescueId: string; scheduledAt?: number; timeZone?: string }
  | {
      type: "requestSession";
      userId: UserId;
      mentorId: UserId;
      topic: string;
      minutes: number;
      note?: string;
      scheduledAt?: number;
      timeZone?: string;
    }
  | { type: "respondSession"; userId: UserId; sessionId: string; accept: boolean }
  | { type: "cancelRequest"; userId: UserId; sessionId: string }
  | { type: "confirmSession"; userId: UserId; sessionId: string }
  | { type: "cancelSession"; userId: UserId; sessionId: string }
  | {
      type: "updateProfile";
      userId: UserId;
      teaches: Profile["teaches"];
      learns: string[];
      availability: Availability;
      blockedDates?: string[];
      timeZone?: string;
    }
  | { type: "reset" };

export type Result = { ok: true; state: DemoState; message: string } | { ok: false; error: string };

const fail = (error: string): Result => ({ ok: false, error });

function nextId(state: DemoState, prefix: string): [string, number] {
  const seq = state.seq + 1;
  return [`${prefix}-${seq}`, seq];
}

type NoticeInput = Omit<SkillNotification, "id" | "createdAt">;

/** Append each event once, even when two tabs or retries process it again. */
function withNotifications(state: DemoState, inputs: NoticeInput[], now: number): DemoState {
  const known = new Set((state.notifications ?? []).map((n) => n.eventKey));
  const additions: SkillNotification[] = [];
  let seq = state.seq;
  for (const input of inputs) {
    if (known.has(input.eventKey)) continue;
    known.add(input.eventKey);
    seq += 1;
    additions.push({ ...input, id: `not-${seq}`, createdAt: now });
  }
  return additions.length
    ? { ...state, seq, notifications: [...additions.reverse(), ...(state.notifications ?? [])] }
    : state;
}

/** Persistent upcoming-session and confirmation reminders, deduplicated by event. */
function syncSessionNotifications(state: DemoState, now: number): DemoState {
  let next = state;
  for (const session of state.sessions.filter((s) => s.status === "accepted")) {
    const participants = [session.learnerId, session.mentorId];
    if (
      session.scheduledAt !== undefined &&
      session.scheduledAt > now &&
      session.scheduledAt - now <= 60 * 60000
    ) {
      next = withNotifications(
        next,
        participants.map((userId) => ({
          eventKey: `session:${session.id}:reminder:${userId}`,
          userId,
          sessionId: session.id,
          kind: "reminder" as const,
          title: "Tu asesoría se acerca",
          body: `«${session.topic}» comienza en menos de una hora.`,
        })),
        now,
      );
    }
    const ready =
      session.earlyDemo !== undefined ||
      session.attentionEndedAt !== undefined ||
      (session.scheduledAt !== undefined && now >= session.scheduledAt + session.minutes * 60000);
    if (ready) {
      next = withNotifications(
        next,
        participants
          .filter((userId) =>
            userId === session.learnerId ? !session.learnerConfirmed : !session.mentorConfirmed,
          )
          .map((userId) => ({
            eventKey: `session:${session.id}:confirmation:${userId}`,
            userId,
            sessionId: session.id,
            kind: "confirmation" as const,
            title: "Confirma tu asesoría",
            body: `Confirma «${session.topic}» para completar el intercambio.`,
          })),
        now,
      );
    }
  }
  return next;
}

const isDuration = (n: number): n is Duration => (DURATIONS as readonly number[]).includes(n);

function insufficient(state: DemoState, learnerId: UserId, minutes: number): string | null {
  const available = availableOf(state, learnerId);
  if (available >= minutes) return null;
  const name = profileOf(state, learnerId).name;
  return `${name} solo tiene ${available} min disponibles y la sesión requiere ${minutes} min.`;
}

function completeIfReady(state: DemoState, session: Session, now: number): DemoState {
  if (!session.learnerConfirmed || !session.mentorConfirmed) return state;
  if (session.status === "completed") return state;
  // Never move minutes twice for the same session.
  const alreadyMoved = state.movements.some((m) => m.sessionId === session.id);
  const [movId, seq] = nextId(state, "mov");
  const learner = profileOf(state, session.learnerId).name;
  const mentor = profileOf(state, session.mentorId).name;
  const movements = alreadyMoved
    ? state.movements
    : [
        ...state.movements,
        {
          id: movId,
          kind: "session" as const,
          sessionId: session.id,
          fromId: session.learnerId,
          toId: session.mentorId,
          minutes: session.minutes,
          spentSources:
            session.reservedSources ??
            (() => {
              const without = {
                ...state,
                sessions: state.sessions.filter((s) => s.id !== session.id),
              };
              return reserveSources(without, session.learnerId, session.minutes);
            })(),
          concept: `${session.topic} · ${learner} → ${mentor}`,
          at: now,
        },
      ];
  const completed: DemoState = {
    ...state,
    seq: alreadyMoved ? state.seq : seq,
    movements,
    sessions: state.sessions.map((s) =>
      s.id === session.id ? { ...session, status: "completed", completedAt: now } : s,
    ),
    rescues: state.rescues.map((r) =>
      r.id === session.rescueId ? { ...r, status: "completed" } : r,
    ),
  };
  return withNotifications(
    completed,
    [session.learnerId, session.mentorId].flatMap((userId) => {
      const incoming = userId === session.mentorId;
      return [
        {
          eventKey: `session:${session.id}:completed:${userId}`,
          userId,
          sessionId: session.id,
          kind: "completed" as const,
          title: "Intercambio completado",
          body: `«${session.topic}» quedó confirmado por ambas personas.`,
        },
        {
          eventKey: `session:${session.id}:balance:${userId}`,
          userId,
          sessionId: session.id,
          kind: "balance" as const,
          title: incoming ? "Recibiste minutos" : "Usaste minutos",
          body: `${incoming ? "+" : "−"}${session.minutes} min por «${session.topic}».`,
        },
      ];
    }),
    now,
  );
}

/** Scenarios are exclusively local. Their session IDs tag all dependent private rows. */
function resetDemoScenario(state: DemoState, scenario: DemoScenario): DemoState {
  const ownSessions = new Set(state.sessions.filter((s) => s.scenarioId === scenario).map((s) => s.id));
  const ownRescues = new Set(state.rescues.filter((r) => r.scenarioId === scenario).map((r) => r.id));
  const snapshots = state.presentation?.profileBackups?.[scenario] ?? {};
  const prevOnboarding = state.presentation?.onboardingBackups?.[scenario];
  const profiles = { ...state.profiles };
  for (const [id, original] of Object.entries(snapshots)) if (original) profiles[id] = original;
  const onboarding = { ...state.onboarding };
  if (prevOnboarding) for (const [id, previous] of Object.entries(prevOnboarding)) {
    if (previous) onboarding[id] = previous;
    else delete onboarding[id];
  }
  const profileBackups = { ...state.presentation?.profileBackups };
  const onboardingBackups = { ...state.presentation?.onboardingBackups };
  delete profileBackups[scenario];
  delete onboardingBackups[scenario];
  return {
    ...state, profiles, onboarding,
    presentation: { ...state.presentation, enabled: Boolean(state.presentation?.enabled),
      scenario: state.presentation?.scenario === scenario ? undefined : state.presentation?.scenario,
      profileBackups, onboardingBackups },
    sessions: state.sessions.filter((s) => !ownSessions.has(s.id)),
    rescues: state.rescues.filter((r) => !ownRescues.has(r.id) && !ownSessions.has(r.sessionId ?? "")),
    messages: (state.messages ?? []).filter((m) => !ownSessions.has(m.sessionId)),
    notifications: (state.notifications ?? []).filter((n) => !ownSessions.has(n.sessionId)),
    reviews: (state.reviews ?? []).filter((r) => !ownSessions.has(r.sessionId) && r.scenarioId !== scenario),
    reports: (state.reports ?? []).filter((r) => !ownSessions.has(r.sessionId) && r.scenarioId !== scenario),
    moderationLog: (state.moderationLog ?? []).filter((r) => r.scenarioId !== scenario && !ownSessions.has(r.reportId)),
    restrictions: (state.restrictions ?? []).filter((r) => r.scenarioId !== scenario),
    movements: state.movements.filter((m) => m.scenarioId !== scenario && !ownSessions.has(m.sessionId ?? "")),
  };
}

function prepareDemoScenario(source: DemoState, scenario: DemoScenario, now: number): Result {
  let state = resetDemoScenario(source, scenario);
  const previousProfiles = { ...state.profiles };
  const previousOnboarding = { ...state.onboarding };
  state = { ...state, presentation: { ...state.presentation, enabled: true, scenario,
    profileBackups: { ...state.presentation?.profileBackups },
    onboardingBackups: { ...state.presentation?.onboardingBackups },
  } };
  const run = (action: Action) => {
    const outcome = applyAction(state, action, now);
    if (!outcome.ok) throw new Error(outcome.error);
    state = outcome.state;
  };
  const topup = (id: UserId, amount: number) => {
    if (availableOf(state, id) < amount) run({ type: "testTopup", userId: id, minutes: 60, id: `scenario-${scenario}-${id}-${now}` });
  };
  const request = (learner: UserId, mentor: UserId, topic: string, accept = false) => {
    topup(learner, 30);
    run({ type: "requestSession", userId: learner, mentorId: mentor, topic, minutes: 15 });
    const sessionId = state.sessions[0]?.id;
    if (!sessionId) throw new Error("No se pudo preparar la solicitud.");
    if (accept) run({ type: "respondSession", userId: mentor, sessionId, accept: true });
    return sessionId;
  };
  const complete = (learner: UserId, mentor: UserId, topic: string, stars?: number) => {
    const id = request(learner, mentor, topic, true);
    run({ type: "adminFinishDemo", userId: mentor, sessionId: id, auditId: `seed-${scenario}-${id}-${now}` });
    run({ type: "confirmSession", userId: learner, sessionId: id });
    run({ type: "confirmSession", userId: mentor, sessionId: id });
    if (stars) run({ type: "submitReview", userId: learner, sessionId: id, rating: stars, comment: "Explicación clara, amable y muy útil para aprender." });
    return id;
  };
  try {
    switch (scenario) {
      case "agenda": {
        state = { ...state, profiles: {
          ...state.profiles,
          emmanuel: { ...state.profiles.emmanuel, availability: [{ day: 1, from: "14:00", to: "16:00" }, { day: 3, from: "14:00", to: "16:00" }, { day: 5, from: "09:00", to: "10:00" }] },
          laura: { ...state.profiles.laura, availability: [{ day: 1, from: "08:00", to: "10:00" }, { day: 1, from: "14:00", to: "16:00" }, { day: 2, from: "08:00", to: "10:00" }] },
          vanessa: { ...state.profiles.vanessa, availability: [{ day: 2, from: "08:00", to: "10:00" }, { day: 4, from: "16:00", to: "18:00" }] },
          "juan-manuel": { ...state.profiles["juan-manuel"], availability: [{ day: 1, from: "14:00", to: "17:00" }, { day: 5, from: "10:00", to: "12:00" }] },
        }, activeUserId: "emmanuel" };
        break;
      }
      case "chat": request("laura", "emmanuel", "Python desde cero");
        state = { ...state, activeUserId: "laura" }; break;
      case "reputation": complete("vanessa", "laura", "HTML y CSS", 5);
        state = { ...state, activeUserId: "laura" }; break;
      case "onboarding": state = { ...state, onboarding: {
          ...state.onboarding, [state.activeUserId]: { step: 0, completed: false },
        } }; break;
      case "matching": state = { ...state, activeUserId: "laura" }; break;
      case "impact":
        for (let i = 0; i < 3; i++) complete("vanessa", "emmanuel", "Python desde cero", 5);
        for (let i = 0; i < 2; i++) complete("juan-manuel", "emmanuel", "Python desde cero", 4);
        state = { ...state, activeUserId: "emmanuel" }; break;
      case "moderation": {
        const id = request("laura", "emmanuel", "Python desde cero", true);
        run({ type: "reportSession", userId: "laura", sessionId: id, reason: "inasistencia", details: "La persona no pudo conectarse a la sesión programada (ejemplo demo)." });
        state = { ...state, activeUserId: "laura" }; break;
      }
      case "rescues": {
        const samples: Array<[UserId, string, string, Category]> = [
          ["emmanuel", "Ayuda con CSS Flexbox", "No puedo centrar el contenedor con Flexbox en CSS.", "HTML y CSS"],
          ["laura", "Necesito practicar inglés", "Quiero practicar una conversación sencilla en inglés.", "Inglés"],
          ["vanessa", "Problema con Git y GitHub", "No sé cómo subir mis cambios a GitHub.", "Programación"],
          ["juan-manuel", "Duda sobre funciones Python", "Necesito ayuda para comprender funciones en Python.", "Programación"],
        ];
        for (const [userId, title, description, category] of samples) {
          run({ type: "publishRescue", userId, title, description, category, minutes: 15 });
        }
        state = { ...state, activeUserId: "emmanuel" }; break;
      }
    }
  } catch (err) {
    return fail(err instanceof Error ? `No fue posible preparar el escenario: ${err.message}` : "No se pudo preparar el escenario.");
  }
  const changedProfiles: Partial<Record<UserId, Profile>> = {};
  for (const id of Object.keys(previousProfiles)) if (JSON.stringify(previousProfiles[id]) !== JSON.stringify(state.profiles[id])) changedProfiles[id] = previousProfiles[id];
  const changedOnboarding: Record<UserId, OnboardingProgress | undefined> = {};
  for (const id of Object.keys(state.onboarding ?? {})) if (JSON.stringify(previousOnboarding[id]) !== JSON.stringify(state.onboarding?.[id])) changedOnboarding[id] = previousOnboarding[id];
  return { ok: true, message: "Escenario preparado. Las acciones y los cambios quedan en la demo local.", state: {
    ...state,
    presentation: { ...state.presentation, enabled: true, scenario,
      profileBackups: { ...state.presentation?.profileBackups, [scenario]: changedProfiles },
      onboardingBackups: { ...state.presentation?.onboardingBackups, [scenario]: changedOnboarding },
    },
  } };
}

export function applyAction(state: DemoState, action: Action, now: number = Date.now()): Result {
  state = normalizeStateAvailability(state);
  if (state.testing && state.sessions.some((s) => !s.demo))
    state = { ...state, sessions: state.sessions.map((s) => ({ ...s, demo: true })) };
  state = syncSessionNotifications(state, now);
  if (["requestSession", "publishRescue", "acceptRescue", "sendMessage"].includes(action.type) &&
      "userId" in action && (state.restrictions ?? []).some((r) => r.targetId === action.userId && r.active))
    return fail("Tu cuenta tiene una restricción comunitaria activa. Contacta a moderación.");
  switch (action.type) {
    case "setPresentation": {
      if (!state.testing) return fail("El modo presentación solo funciona en la demo.");
      return { ok: true, message: action.enabled ? "Modo presentación activado." : "Modo presentación desactivado.", state: {
        ...state, presentation: { ...state.presentation, enabled: action.enabled, collapsed: action.collapsed ?? state.presentation?.collapsed },
      } };
    }
    case "setDemoAdmin": {
      if (!state.testing || !state.presentation?.enabled) return fail("Activa primero el modo presentación.");
      return { ok: true, message: action.enabled ? "Administrador demo activado (sin permisos reales)." : "Administrador demo desactivado.", state: {
        ...state, presentation: { ...state.presentation, enabled: true, adminEnabled: action.enabled },
      } };
    }
    case "prepareScenario": {
      if (!state.testing || !state.presentation?.enabled) return fail("Solo puedes preparar escenarios en modo presentación.");
      return prepareDemoScenario(state, action.scenario, now);
    }
    case "resetScenario": {
      if (!state.testing || !state.presentation?.enabled) return fail("Solo puedes reiniciar escenarios de demostración.");
      return { ok: true, message: "Escenario reiniciado sin afectar los demás.", state: resetDemoScenario(state, action.scenario) };
    }
    case "demoFinishLocally": {
      if (!state.testing || !state.presentation?.enabled || !state.presentation.adminEnabled)
        return fail("Activa Administrador demo desde el panel de presentación.");
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session?.demo || session.status !== "accepted" || session.earlyDemo)
        return fail("Solo puedes finalizar una asesoría demo aceptada una vez.");
      const result = applyAction(state, {
        type: "adminFinishDemo", userId: action.userId, sessionId: session.id, auditId: `demo-local-${session.id}-${now}`,
      }, now);
      return result.ok ? { ...result, state: { ...result.state, moderationLog: [
        ...(result.state.moderationLog ?? []),
        { id: `audit-${session.id}`, reportId: session.id, moderatorId: action.userId, decision: "Cierre anticipado simulado (solo demo)", createdAt: now, ...(session.scenarioId ? { scenarioId: session.scenarioId } : {}) },
      ] } } : result;
    }
    case "updateProfileDetails": {
      const profile = state.profiles[action.userId];
      if (!profile) return fail("Perfil inexistente.");
      if (action.bio.trim().length > 700 || action.tagline.trim().length > 100)
        return fail("Biografía o descripción demasiado extensa.");
      const validLink = (value: string) => !value || (value.length < 400 && /^https:\/\/[^\s]+$/.test(value));
      if (!validLink(action.githubUrl) || !validLink(action.portfolioUrl)) return fail("Los enlaces deben comenzar con https://.");
      if (action.photoUrl && !((/^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(action.photoUrl) && action.photoUrl.length < 240000) || validLink(action.photoUrl))) return fail("Foto inválida o demasiado grande.");
      const allowed = ["Inicial", "Intermedio", "Avanzado"];
      if (Object.values(action.levels).some((level) => !allowed.includes(level))) return fail("Nivel de experiencia inválido.");
      return { ok: true, message: "Información del perfil guardada.", state: { ...state, profiles: { ...state.profiles, [action.userId]: {
        ...profile, bio: action.bio.trim(), tagline: action.tagline.trim(), photoUrl: action.photoUrl, portfolioUrl: action.portfolioUrl, githubUrl: action.githubUrl,
        teaches: profile.teaches.map((sk) => ({ ...sk, level: action.levels[sk.id] ?? sk.level ?? "Inicial" })),
      } } } };
    }
    case "submitReview": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session || session.status !== "completed" || (session.learnerId !== action.userId && session.mentorId !== action.userId))
        return fail("Solo puedes valorar después de completar un intercambio propio.");
      if ((state.reviews ?? []).some((review) => review.sessionId === session.id && review.authorId === action.userId))
        return fail("Ya valoraste esta sesión.");
      if (!Number.isInteger(action.rating) || action.rating < 1 || action.rating > 5 || action.comment.trim().length < 5 || action.comment.length > 700)
        return fail("Califica de 1 a 5 estrellas y escribe una reseña de al menos 5 caracteres.");
      const [id, seq] = nextId(state, "rev");
      return { ok: true, message: "Reseña verificada publicada.", state: { ...state, seq, reviews: [...(state.reviews ?? []), {
        id, sessionId: session.id, authorId: action.userId,
        targetId: session.learnerId === action.userId ? session.mentorId : session.learnerId,
        rating: action.rating, comment: action.comment.trim(), createdAt: now,
        ...(session.scenarioId ? { scenarioId: session.scenarioId } : {}),
      }] } };
    }
    case "saveOnboarding": {
      if (!state.profiles[action.userId] || !Number.isInteger(action.step) || action.step < 0 || action.step > 5) return fail("Paso no válido.");
      if (action.completed && action.step !== 5) return fail("Completa los cinco pasos antes de finalizar.");
      const previous = state.onboarding?.[action.userId];
      if (previous?.completed && !state.testing) return fail("Ya terminaste tu bienvenida.");
      if (!state.testing && previous && action.step > previous.step + 1) return fail("Avanza un paso a la vez.");
      return { ok: true, message: action.completed ? "¡Bienvenida completada!" : "Progreso guardado.", state: {
        ...state, onboarding: { ...state.onboarding, [action.userId]: { step: action.step, completed: action.completed } },
      } };
    }
    case "reportSession": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session || (session.mentorId !== action.userId && session.learnerId !== action.userId)) return fail("Solo puedes reportar tus intercambios.");
      if ((state.reports ?? []).some((r) => r.sessionId === session.id && r.authorId === action.userId && r.status === "open")) return fail("Ya tienes un reporte abierto para esta sesión.");
      if (!(["conducta", "inasistencia", "incumplimiento", "otro"] as string[]).includes(action.reason) || action.details.trim().length < 10 || action.details.length > 800) return fail("Describe el inconveniente con al menos 10 caracteres.");
      const [id, seq] = nextId(state, "rep");
      return { ok: true, message: "Reporte enviado a moderación.", state: { ...state, seq, reports: [...(state.reports ?? []), {
        id, sessionId: session.id, authorId: action.userId,
        reportedId: session.learnerId === action.userId ? session.mentorId : session.learnerId,
        reason: action.reason, details: action.details.trim(), status: "open" as const, createdAt: now,
        ...(session.scenarioId ? { scenarioId: session.scenarioId } : {}),
      }] } };
    }
    case "moderateReport": {
      // Server actions verify the authenticated role. A demo moderator must be explicitly enabled.
      if (state.testing && (!state.presentation?.enabled || !state.presentation.adminEnabled)) return fail("Activa Administrador demo.");
      const report = (state.reports ?? []).find((r) => r.id === action.reportId);
      if (!report || report.status !== "open") return fail("Reporte inexistente o ya resuelto.");
      if (action.resolution.trim().length < 8 || action.resolution.length > 800) return fail("Describe la decisión administrativa.");
      const [id, seq] = nextId(state, "audit");
      return { ok: true, message: "Decisión guardada en el historial.", state: {
        ...state, seq,
        reports: (state.reports ?? []).map((r) => r.id === report.id ? { ...r, status: "resolved" as const, resolvedAt: now, resolvedBy: action.userId, resolution: action.resolution.trim() } : r),
        moderationLog: [...(state.moderationLog ?? []), { id, reportId: report.id, moderatorId: action.userId, decision: action.resolution.trim(), createdAt: now, ...(report.scenarioId ? { scenarioId: report.scenarioId } : {}) }],
      } };
    }
    case "setUserRestriction": {
      if (!state.profiles[action.targetId]) return fail("Usuario inexistente.");
      if (state.testing && (!state.presentation?.enabled || !state.presentation?.adminEnabled)) return fail("Activa Administrador demo.");
      if (action.reason.trim().length < 8 || action.reason.length > 800) return fail("Explica el motivo de la restricción.");
      const existing = (state.restrictions ?? []).find((r) => r.targetId === action.targetId && r.active);
      if (existing && action.active) return fail("Este usuario ya tiene una restricción activa.");
      if (!existing && !action.active) return fail("No hay una restricción activa para retirar.");
      const [id, seq] = nextId(state, "restrict");
      return { ok: true, message: action.active ? "Restricción aplicada y auditada." : "Restricción retirada y auditada.", state: {
        ...state, seq,
        restrictions: action.active ? [...(state.restrictions ?? []), {
          id, targetId: action.targetId, moderatorId: action.userId, reason: action.reason.trim(), active: true, createdAt: now,
          ...(state.testing && state.presentation?.scenario ? { scenarioId: state.presentation.scenario } : {}),
        }] : (state.restrictions ?? []).map((r) => r.id === existing?.id ? { ...r, active: false, updatedAt: now } : r),
        moderationLog: [...(state.moderationLog ?? []), {
          id: `audit-${id}`, reportId: `user:${action.targetId}`, moderatorId: action.userId,
          decision: `${action.active ? "Restricción" : "Levantamiento de restricción"}: ${action.reason.trim()}`,
          createdAt: now,
          ...(state.testing && state.presentation?.scenario ? { scenarioId: state.presentation.scenario } : {}),
        }],
      } };
    }
    case "testTopup": {
      if (!state.testing || !state.profiles[action.userId])
        return fail("Acción exclusiva de la demo.");
      const pack = (state.testPackages ?? TEST_PACKAGES).find((p) => p.minutes === action.minutes);
      if (!pack || !action.id || action.id.length > 100) return fail("Paquete no válido.");
      if (state.movements.some((m) => m.topupId === action.id))
        return { ok: true, state, message: "Recarga ya registrada." };
      return {
        ok: true,
        message: `Recarga simbólica guardada · +${pack.minutes} min.`,
        state: {
          ...state,
          movements: [
            ...state.movements,
            {
              id: `topup-${action.id}`,
              kind: "topup",
              topupId: action.id,
              toId: action.userId,
              minutes: pack.minutes,
              priceCop: pack.priceCop,
              concept: "Recarga simbólica",
              at: now,
              ...(state.presentation?.scenario ? { scenarioId: state.presentation.scenario } : {}),
            },
          ],
        },
      };
    }
    case "testWithdraw": {
      if (!state.testing || !state.profiles[action.userId])
        return fail("Acción exclusiva de la demo.");
      if (
        !action.id ||
        action.id.length > 100 ||
        !Number.isSafeInteger(action.blocks) ||
        action.blocks < 1 ||
        action.blocks > 10000
      )
        return fail("Indica bloques completos de 60 minutos.");
      if (state.movements.some((m) => m.withdrawalId === action.id))
        return { ok: true, state, message: "Retiro ya registrado." };
      const minutes = action.blocks * 60;
      if (earnedAvailableOf(state, action.userId) < minutes)
        return fail("No tienes suficientes minutos ganados sin reservar para este retiro.");
      return {
        ok: true,
        message: `Retiro simbólico guardado · −${minutes} min. Sin transferencia de dinero real.`,
        state: {
          ...state,
          movements: [
            ...state.movements,
            {
              id: `withdrawal-${action.id}`,
              kind: "withdrawal",
              withdrawalId: action.id,
              fromId: action.userId,
              toId: "",
              minutes,
              priceCop: action.blocks * 16000,
              spentSources: { regular: 0, earned: minutes },
              concept: "Retiro simbólico",
              at: now,
            },
          ],
        },
      };
    }
    case "testConfigurePackages": {
      if (!state.testing) return fail("Acción exclusiva del modo de prueba.");
      if (
        action.prices.length !== 3 ||
        action.prices.some((p) => !Number.isSafeInteger(p) || p < 1 || p > 10000000)
      )
        return fail("Indica tres precios válidos en COP.");
      return {
        ok: true,
        message: "Precios de ejemplo actualizados.",
        state: {
          ...state,
          testPackages: TEST_PACKAGES.map((p, i) => ({
            minutes: p.minutes,
            priceCop: action.prices[i] ?? p.priceCop,
          })),
        },
      };
    }
    case "testSaveDraft":
    case "saveRequestDraft": {
      if (
        (action.type === "testSaveDraft" && !state.testing) ||
        !state.profiles[action.userId] ||
        !state.profiles[action.mentorId] ||
        action.userId === action.mentorId ||
        !isDuration(action.minutes) ||
        !action.topic.trim()
      )
        return fail("Borrador no válido.");
      if (
        action.scheduledAt !== undefined &&
        (!Number.isSafeInteger(action.scheduledAt) ||
          !validTimeZone(action.timeZone ?? DEFAULT_TIME_ZONE))
      )
        return fail("Fecha no válida.");
      return {
        ok: true,
        message: "Borrador guardado.",
        state: {
          ...state,
          requestDrafts: {
            ...state.requestDrafts,
            [action.userId]: {
              mentorId: action.mentorId,
              topic: action.topic.trim(),
              minutes: action.minutes,
              note: action.note,
              ...(action.scheduledAt !== undefined
                ? {
                    scheduledAt: action.scheduledAt,
                    timeZone: action.timeZone ?? DEFAULT_TIME_ZONE,
                  }
                : {}),
            },
          },
        },
      };
    }
    case "testCreateTopup": {
      if (!state.testing || !state.profiles[action.userId])
        return fail("Acción exclusiva del modo de prueba.");
      const pack = (state.testPackages ?? TEST_PACKAGES).find((p) => p.minutes === action.minutes);
      if (!pack || !action.id || action.id.length > 100) return fail("Paquete no válido.");
      if (state.topups?.some((t) => t.id === action.id))
        return { ok: true, state, message: "Recarga ya registrada." };
      return {
        ok: true,
        message: "Recarga pendiente. No se han acreditado minutos.",
        state: {
          ...state,
          topups: [
            ...(state.topups ?? []),
            {
              id: action.id,
              userId: action.userId,
              minutes: pack.minutes,
              priceCop: pack.priceCop,
              status: "pending",
              createdAt: now,
            },
          ],
        },
      };
    }
    case "testResolveTopup": {
      if (!state.testing) return fail("Acción exclusiva del modo de prueba.");
      const topup = state.topups?.find((t) => t.id === action.id && t.userId === action.userId);
      if (!topup) return fail("No encontramos esa recarga.");
      if (topup.status !== "pending")
        return { ok: true, state, message: "Esta recarga ya fue procesada." };
      const credit = action.approved && !state.movements.some((m) => m.topupId === topup.id);
      return {
        ok: true,
        message: action.approved
          ? "Pago de prueba aprobado. Minutos acreditados."
          : "Pago de prueba rechazado. Tu saldo no cambió.",
        state: {
          ...state,
          topups: (state.topups ?? []).map((t) =>
            t.id === topup.id
              ? { ...t, status: action.approved ? ("approved" as const) : ("rejected" as const) }
              : t,
          ),
          movements: credit
            ? [
                ...state.movements,
                {
                  id: `topup-${topup.id}`,
                  kind: "topup",
                  topupId: topup.id,
                  toId: topup.userId,
                  minutes: topup.minutes,
                  concept: "Recarga de minutos",
                  at: now,
                },
              ]
            : state.movements,
        },
      };
    }
    case "reset":
      return {
        ok: true,
        state: {
          ...createSeed(now),
          ...(state.testing
            ? {
                testing: true,
                topups: [],
                requestDrafts: {},
                testPackages: state.testPackages ?? [...TEST_PACKAGES],
              }
            : {}),
        },
        message: "Demo reiniciada.",
      };

    case "switchUser": {
      if (!profileOf(state, action.userId)) return fail("Ese perfil no existe.");
      return {
        ok: true,
        state: { ...state, activeUserId: action.userId },
        message: `Ahora usas el perfil de ${profileOf(state, action.userId).name}.`,
      };
    }

    case "publishRescue": {
      const title = action.title.trim();
      const description = action.description.trim();
      if (title.length < 5) return fail("Escribe un título de al menos 5 caracteres.");
      if (description.length < 10) return fail("Describe tu duda con al menos 10 caracteres.");
      if (!CATEGORIES.includes(action.category)) return fail("Elige una categoría.");
      if (!isDuration(action.minutes)) return fail("La duración debe ser 15 o 30 minutos.");
      if (action.timing && !["immediate", "scheduled"].includes(action.timing)) return fail("Modalidad no válida.");
      const [id, seq] = nextId(state, "res");
      const drafts = { ...state.drafts };
      delete drafts[action.userId];
      const rescue: Rescue = {
              id,
              authorId: action.userId,
              title,
              description,
              category: action.category,
              minutes: action.minutes,
              status: "open",
              createdAt: now,
              attentionFlow: true,
              timing: action.timing ?? ("immediate" as const),
              ...(state.testing && state.presentation?.scenario ? { scenarioId: state.presentation.scenario } : {}),
            };
      const updated = { ...state, seq, drafts, rescues: [rescue, ...state.rescues] } as DemoState;
      return { ok: true, message: "Rescate publicado. Avisamos a quienes pueden ayudarte.", state: withNotifications(updated,
        Object.values(state.profiles).filter((p) => p.id !== action.userId && rescueRelevance(updated, p.id, rescue) > 0).map((p) => ({
          eventKey: `rescue:${id}:${p.id}`,
          sessionId: "",
          rescueId: id,
          userId: p.id,
          kind: "rescue" as const,
          title: "Un rescate coincide con tus habilidades",
          body: `${profileOf(state, action.userId).name} necesita ayuda: «${title}».`,
        })), now),
      };
    }

    case "withdrawRescue": {
      const rescue = state.rescues.find((r) => r.id === action.rescueId);
      if (!rescue) return fail("No encontramos ese rescate.");
      if (rescue.authorId !== action.userId)
        return fail("Solo quien publicó el rescate puede retirarlo.");
      if (rescue.status !== "open") return fail("Solo puedes retirar rescates abiertos.");
      return {
        ok: true,
        message: "Rescate retirado.",
        state: {
          ...state,
          rescues: state.rescues.map((r) =>
            r.id === rescue.id ? { ...r, status: "withdrawn" } : r,
          ),
        },
      };
    }

    case "acceptRescue": {
      const rescue = state.rescues.find((r) => r.id === action.rescueId);
      if (!rescue) return fail("No encontramos ese rescate.");
      if (rescue.authorId === action.userId) return fail("No puedes aceptar tu propio rescate.");
      if (rescue.status !== "open") return fail("Este rescate ya no está abierto.");
      const lack = insufficient(state, rescue.authorId, rescue.minutes);
      if (lack) return fail(lack);
      if (rescue.timing === "scheduled") {
        if (action.scheduledAt === undefined) return fail("Selecciona una fecha y hora para el rescate programado.");
        const error = schedulingError(state, rescue.authorId, action.userId, action.scheduledAt, rescue.minutes, now);
        if (error) return fail(error);
        if (action.timeZone !== (state.profiles[action.userId]?.timeZone ?? DEFAULT_TIME_ZONE)) return fail("La zona horaria cambió. Actualiza la reserva.");
      }
      const [sessionId, seq] = nextId(state, "ses");
      return {
        ok: true,
        message: `Aceptaste el rescate. Se reservaron ${rescue.minutes} min de ${profileOf(state, rescue.authorId).name}.`,
        state: withNotifications(
          {
            ...state,
            seq,
            rescues: state.rescues.map((r) =>
              r.id === rescue.id
                ? { ...r, status: "accepted", helperId: action.userId, sessionId }
                : r,
            ),
            sessions: [
              {
                id: sessionId,
                learnerId: rescue.authorId,
                mentorId: action.userId,
                minutes: rescue.minutes,
                topic: rescue.title,
                origin: "rescue",
                rescueId: rescue.id,
                status: "accepted",
                learnerConfirmed: false,
                mentorConfirmed: false,
                createdAt: now,
                acceptedAt: now,
                ...(state.testing ? { demo: true } : {}),
                ...(state.testing && state.presentation?.scenario ? { scenarioId: state.presentation.scenario } : {}),
                reservedSources: reserveSources(state, rescue.authorId, rescue.minutes),
                ...(rescue.timing === "scheduled" ? { scheduledAt: action.scheduledAt!, timeZone: action.timeZone ?? DEFAULT_TIME_ZONE } : rescue.attentionFlow ? { attentionFlow: true } : {}),
              },
              ...state.sessions,
            ],
          },
          [
            {
              eventKey: `session:${sessionId}:accepted:${rescue.authorId}`,
              userId: rescue.authorId,
              sessionId,
              kind: "accepted",
              title: "Tu rescate fue aceptado",
              body: `${profileOf(state, action.userId).name} aceptó ayudarte con «${rescue.title}».`,
            },
          ],
          now,
        ),
      };
    }

    case "requestSession": {
      if (action.mentorId === action.userId)
        return fail("No puedes solicitarte una sesión a ti mismo.");
      if (!profileOf(state, action.mentorId)) return fail("Ese perfil no existe.");
      if (!isDuration(action.minutes)) return fail("La duración debe ser 15 o 30 minutos.");
      const topic = action.topic.trim();
      if (!topic) return fail("Indica qué quieres aprender.");
      if (!state.profiles[action.userId]) return fail("Ese perfil no existe.");
      if (action.scheduledAt !== undefined) {
        const error = schedulingError(
          state,
          action.userId,
          action.mentorId,
          action.scheduledAt,
          action.minutes,
          now,
        );
        if (error) return fail(error);
        if (action.timeZone !== (state.profiles[action.mentorId]?.timeZone ?? DEFAULT_TIME_ZONE))
          return fail("La zona horaria del mentor cambió. Revisa el horario.");
        if (!state.profiles[action.mentorId]?.teaches.some((s) => s.name === topic))
          return fail("Selecciona una habilidad que ofrece el mentor.");
      }
      const [id, seq] = nextId(state, "ses");
      return {
        ok: true,
        message: `Solicitud enviada a ${profileOf(state, action.mentorId).name}. La verás en Mis intercambios.`,
        state: withNotifications(
          {
            ...state,
            seq,
            requestDrafts: Object.fromEntries(
              Object.entries(state.requestDrafts ?? {}).filter(([id]) => id !== action.userId),
            ),
            sessions: [
              {
                id,
                learnerId: action.userId,
                mentorId: action.mentorId,
                minutes: action.minutes,
                topic,
                ...(action.note?.trim() ? { note: action.note.trim() } : {}),
                origin: "explore",
                status: "pending",
                learnerConfirmed: false,
                mentorConfirmed: false,
                createdAt: now,
                ...(state.testing ? { demo: true } : {}),
                ...(state.testing && state.presentation?.scenario ? { scenarioId: state.presentation.scenario } : {}),
                ...(action.scheduledAt !== undefined
                  ? {
                      scheduledAt: action.scheduledAt,
                      timeZone: action.timeZone ?? DEFAULT_TIME_ZONE,
                    }
                  : {}),
              },
              ...state.sessions,
            ],
          },
          [
            {
              eventKey: `session:${id}:request:${action.mentorId}`,
              userId: action.mentorId,
              sessionId: id,
              kind: "request",
              title: "Nueva solicitud de intercambio",
              body: `${profileOf(state, action.userId).name} te pidió ayuda con «${topic}».`,
            },
          ],
          now,
        ),
      };
    }

    case "respondSession": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session) return fail("No encontramos esa sesión.");
      if (session.mentorId !== action.userId)
        return fail("Solo quien ofrece la ayuda puede responder.");
      if (session.status !== "pending") return fail("Esta solicitud ya fue respondida.");
      if (!action.accept) {
        return {
          ok: true,
          message: "Solicitud rechazada.",
          state: withNotifications(
            {
              ...state,
              sessions: state.sessions.map((s) =>
                s.id === session.id ? { ...s, status: "declined" } : s,
              ),
            },
            [
              {
                eventKey: `session:${session.id}:declined:${session.learnerId}`,
                userId: session.learnerId,
                sessionId: session.id,
                kind: "declined",
                title: "Solicitud rechazada",
                body: `${profileOf(state, session.mentorId).name} no pudo aceptar «${session.topic}».`,
              },
            ],
            now,
          ),
        };
      }
      const lack = insufficient(state, session.learnerId, session.minutes);
      if (lack) return fail(lack);
      if (session.scheduledAt !== undefined) {
        const error = schedulingError(
          state,
          session.learnerId,
          session.mentorId,
          session.scheduledAt,
          session.minutes,
          now,
          session.id,
        );
        if (error) return fail(error);
      }
      return {
        ok: true,
        message: `Sesión aceptada. Se reservaron ${session.minutes} min de ${profileOf(state, session.learnerId).name}.`,
        state: withNotifications(
          {
            ...state,
            sessions: state.sessions.map((s) =>
              s.id === session.id
                ? {
                    ...s,
                    status: "accepted",
                    acceptedAt: now,
                    reservedSources: reserveSources(state, session.learnerId, session.minutes),
                  }
                : s,
            ),
          },
          [
            {
              eventKey: `session:${session.id}:accepted:${session.learnerId}`,
              userId: session.learnerId,
              sessionId: session.id,
              kind: "accepted",
              title: "Solicitud aceptada",
              body: `${profileOf(state, session.mentorId).name} aceptó «${session.topic}». Ya se reservaron los minutos.`,
            },
          ],
          now,
        ),
      };
    }

    case "cancelRequest": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session) return fail("No encontramos esa sesión.");
      if (session.learnerId !== action.userId)
        return fail("Solo quien pidió la sesión puede cancelarla.");
      if (session.status !== "pending") return fail("Solo puedes cancelar solicitudes pendientes.");
      return {
        ok: true,
        message: "Solicitud cancelada.",
        state: withNotifications(
          {
            ...state,
            sessions: state.sessions.map((s) =>
              s.id === session.id ? { ...s, status: "cancelled" } : s,
            ),
          },
          [
            {
              eventKey: `session:${session.id}:cancelled:${session.mentorId}`,
              userId: session.mentorId,
              sessionId: session.id,
              kind: "cancelled",
              title: "Solicitud cancelada",
              body: `${profileOf(state, session.learnerId).name} canceló «${session.topic}».`,
            },
          ],
          now,
        ),
      };
    }

    case "cancelSession": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session) return fail("No encontramos esa sesión.");
      if (session.learnerId !== action.userId && session.mentorId !== action.userId)
        return fail("No participas en esta sesión.");
      if (session.status !== "accepted" || (session.learnerConfirmed && session.mentorConfirmed))
        return fail("Esta sesión ya no se puede cancelar.");
      return {
        ok: true,
        message: "Sesión cancelada. Minutos liberados.",
        state: withNotifications(
          {
            ...state,
            sessions: state.sessions.map((s) =>
              s.id === session.id
                ? { ...s, status: "cancelled", cancelledAt: now, cancelledBy: action.userId }
                : s,
            ),
            rescues: state.rescues.map((r) =>
              r.id === session.rescueId
                ? (() => {
                    const { helperId, sessionId, ...open } = r;
                    return { ...open, status: "open" as const };
                  })()
                : r,
            ),
          },
          [
            {
              eventKey: `session:${session.id}:cancelled:${action.userId === session.learnerId ? session.mentorId : session.learnerId}`,
              userId: action.userId === session.learnerId ? session.mentorId : session.learnerId,
              sessionId: session.id,
              kind: "cancelled",
              title: "Sesión cancelada",
              body: `${profileOf(state, action.userId).name} canceló «${session.topic}». Los minutos reservados fueron liberados.`,
            },
          ],
          now,
        ),
      };
    }

    case "confirmSession": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session) return fail("No encontramos esa sesión.");
      const isLearner = session.learnerId === action.userId;
      const isMentor = session.mentorId === action.userId;
      if (!isLearner && !isMentor) return fail("No participas en esta sesión.");
      if (session.status === "completed") return fail("Esta sesión ya está completada.");
      if (session.status !== "accepted") return fail("Solo puedes confirmar sesiones aceptadas.");
      if (
        !session.earlyDemo &&
        session.scheduledAt !== undefined &&
        now < session.scheduledAt + session.minutes * 60000
      )
        return fail("Podrás confirmar cuando termine el horario programado.");
      if (session.attentionFlow && session.attentionEndedAt === undefined)
        return fail("Primero registra el inicio y el fin de la atención realizada.");
      if ((isLearner && session.learnerConfirmed) || (isMentor && session.mentorConfirmed)) {
        return fail("Ya confirmaste esta sesión. Falta la otra persona.");
      }
      const updated: Session = {
        ...session,
        learnerConfirmed: session.learnerConfirmed || isLearner,
        mentorConfirmed: session.mentorConfirmed || isMentor,
      };
      const withFlag: DemoState = {
        ...state,
        sessions: state.sessions.map((s) => (s.id === session.id ? updated : s)),
      };
      const done = updated.learnerConfirmed && updated.mentorConfirmed;
      return {
        ok: true,
        state: done
          ? completeIfReady(withFlag, updated, now)
          : withNotifications(
              withFlag,
              [
                {
                  eventKey: `session:${session.id}:confirmation:${isLearner ? session.mentorId : session.learnerId}`,
                  userId: isLearner ? session.mentorId : session.learnerId,
                  sessionId: session.id,
                  kind: "confirmation",
                  title: "Confirma tu asesoría",
                  body: `${profileOf(state, action.userId).name} ya confirmó «${session.topic}». Falta tu confirmación.`,
                },
              ],
              now,
            ),
        message: done
          ? `¡Sesión completada! Se transfirieron ${session.minutes} min a ${profileOf(state, session.mentorId).name}.`
          : "Confirmaste la sesión. Falta que la otra persona confirme.",
      };
    }

    case "sendMessage": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session || (session.learnerId !== action.userId && session.mentorId !== action.userId))
        return fail("No participas en esta conversación.");
      const body = action.body.trim();
      if (!body || body.length > 4000 || !action.clientId.trim() || action.clientId.length > 100)
        return fail("Escribe un mensaje de hasta 4000 caracteres.");
      const repeated = (state.messages ?? []).find(
        (m) =>
          m.sessionId === session.id &&
          m.senderId === action.userId &&
          m.clientId === action.clientId,
      );
      if (repeated) return { ok: true, state, message: "Mensaje enviado." };
      const [id, seq] = nextId(state, "msg");
      const recipientId =
        session.learnerId === action.userId ? session.mentorId : session.learnerId;
      const withMessage: DemoState = {
        ...state,
        seq,
        messages: [
          ...(state.messages ?? []),
          {
            id,
            sessionId: session.id,
            senderId: action.userId,
            body,
            clientId: action.clientId,
            createdAt: now,
          },
        ],
      };
      return {
        ok: true,
        message: "Mensaje enviado.",
        state: withNotifications(
          withMessage,
          [
            {
              eventKey: `message:${id}:${recipientId}`,
              userId: recipientId,
              sessionId: session.id,
              kind: "message",
              title: `Mensaje de ${profileOf(state, action.userId).name}`,
              body: body.length > 120 ? `${body.slice(0, 117)}…` : body,
            },
          ],
          now,
        ),
      };
    }

    case "markNotificationRead": {
      const notification = (state.notifications ?? []).find((n) => n.id === action.notificationId);
      if (!notification || notification.userId !== action.userId)
        return fail("No encontramos esa notificación.");
      if (notification.readAt !== undefined)
        return { ok: true, state, message: "Notificación leída." };
      return {
        ok: true,
        message: "Notificación leída.",
        state: {
          ...state,
          notifications: (state.notifications ?? []).map((n) =>
            n.id === notification.id ? { ...n, readAt: now } : n,
          ),
        },
      };
    }

    case "markAllNotificationsRead":
      return {
        ok: true,
        message: "Notificaciones leídas.",
        state: {
          ...state,
          notifications: (state.notifications ?? []).map((n) =>
            n.userId === action.userId && n.readAt === undefined ? { ...n, readAt: now } : n,
          ),
        },
      };

    case "syncNotifications":
      return { ok: true, state, message: "Notificaciones actualizadas." };

    case "adminFinishDemo": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!state.testing || !session?.demo)
        return fail("La finalización anticipada solo está disponible en sesiones demostrativas.");
      if (session.status !== "accepted") return fail("Esta sesión ya no se puede finalizar.");
      if (!/^[a-zA-Z0-9-]{8,100}$/.test(action.auditId))
        return fail("La autorización administrativa no es válida.");
      if (session.earlyDemo) {
        if (session.earlyDemo.auditId === action.auditId)
          return { ok: true, state, message: "La finalización demo ya fue registrada." };
        return fail("Esta sesión demo ya fue finalizada anticipadamente.");
      }
      const updated: Session = {
        ...session,
        earlyDemo: { byUserId: action.userId, at: now, auditId: action.auditId },
        ...(session.attentionFlow
          ? { attentionStartedAt: session.attentionStartedAt ?? now, attentionEndedAt: now }
          : {}),
      };
      const next = {
        ...state,
        sessions: state.sessions.map((s) => (s.id === session.id ? updated : s)),
      };
      return {
        ok: true,
        message: "Asesoría demo finalizada. Ambas personas ya pueden confirmar.",
        state: withNotifications(
          next,
          [session.learnerId, session.mentorId].map((userId) => ({
            eventKey: `session:${session.id}:confirmation:${userId}`,
            userId,
            sessionId: session.id,
            kind: "confirmation" as const,
            title: "Asesoría demo lista para confirmar",
            body: `La finalización anticipada de «${session.topic}» fue registrada. Confirma para cerrar el intercambio.`,
          })),
          now,
        ),
      };
    }

    case "updateProfile": {
      const { availability } = action;
      const error = availabilityError(availability);
      if (error) return fail(error);
      const profile = state.profiles[action.userId];
      if (!profile) return fail("Ese perfil no existe.");
      const timeZone = action.timeZone ?? profile.timeZone ?? DEFAULT_TIME_ZONE;
      const blockedDates = action.blockedDates ?? profile.blockedDates ?? [];
      if (!validTimeZone(timeZone)) return fail("Zona horaria no válida.");
      if (!Array.isArray(blockedDates) || blockedDates.some((d) => !validDate(d)))
        return fail("Fecha bloqueada no válida.");
      const proposed = {
        ...profile,
        availability,
        timeZone,
        blockedDates: [...new Set(blockedDates)].sort(),
      };
      for (const session of state.sessions.filter(
        (s) =>
          s.status === "accepted" &&
          s.scheduledAt !== undefined &&
          s.scheduledAt + s.minutes * 60000 > now &&
          (s.mentorId === action.userId || s.learnerId === action.userId),
      )) {
        if (session.scheduledAt === undefined) continue;
        const date = localParts(session.scheduledAt, timeZone).date;
        if (
          proposed.blockedDates.includes(date) ||
          (session.mentorId === action.userId &&
            !withinAvailability(proposed, session.scheduledAt, session.minutes))
        )
          return fail(
            "Tienes una reserva aceptada en ese horario. Reprográmala o cancélala antes de cambiar tu disponibilidad.",
          );
      }
      const teaches = action.teaches
        .map((s) => ({ ...s, name: s.name.trim() }))
        .filter((s) => s.name.length > 0);
      const learns = action.learns.map((l) => l.trim()).filter(Boolean);
      return {
        ok: true,
        message: "Perfil actualizado.",
        state: {
          ...state,
          profiles: {
            ...state.profiles,
            [action.userId]: {
              ...profileOf(state, action.userId),
              teaches,
              learns,
              timeZone,
              blockedDates: proposed.blockedDates,
              availability: [...availability]
                .sort(
                  (a, b) =>
                    WEEK_ORDER.indexOf(a.day) - WEEK_ORDER.indexOf(b.day) ||
                    a.from.localeCompare(b.from),
                )
                .map((slot) => ({ ...slot })),
            },
          },
        },
      };
    }
    case "proposeReschedule": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session || (session.learnerId !== action.userId && session.mentorId !== action.userId))
        return fail("No participas en esta sesión.");
      if (
        session.status !== "accepted" ||
        session.scheduledAt === undefined ||
        session.learnerConfirmed ||
        session.mentorConfirmed
      )
        return fail("Esta sesión no se puede reprogramar.");
      if (session.reschedule) return fail("Responde primero a la propuesta pendiente.");
      if (action.scheduledAt === session.scheduledAt)
        return fail("Selecciona un horario diferente.");
      if (action.timeZone !== (state.profiles[session.mentorId]?.timeZone ?? DEFAULT_TIME_ZONE))
        return fail("Revisa la zona horaria del mentor.");
      const error = schedulingError(
        state,
        session.learnerId,
        session.mentorId,
        action.scheduledAt,
        session.minutes,
        now,
        session.id,
      );
      if (error) return fail(error);
      return {
        ok: true,
        message:
          "Propuesta enviada. La reserva original se mantiene hasta que la otra persona acepte.",
        state: {
          ...state,
          sessions: state.sessions.map((s) =>
            s.id === session.id
              ? {
                  ...s,
                  reschedule: {
                    scheduledAt: action.scheduledAt,
                    timeZone: action.timeZone,
                    proposedBy: action.userId,
                    proposedAt: now,
                  },
                }
              : s,
          ),
        },
      };
    }
    case "respondReschedule": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session || (session.learnerId !== action.userId && session.mentorId !== action.userId))
        return fail("No participas en esta sesión.");
      const proposal = session.reschedule;
      if (
        session.status !== "accepted" ||
        !proposal ||
        proposal.proposedBy === action.userId ||
        session.scheduledAt === undefined ||
        session.learnerConfirmed ||
        session.mentorConfirmed
      )
        return fail("No puedes responder a esta propuesta.");
      if (action.accept) {
        const error = schedulingError(
          state,
          session.learnerId,
          session.mentorId,
          proposal.scheduledAt,
          session.minutes,
          now,
          session.id,
        );
        if (error) return fail(error);
      }
      const { reschedule, ...original } = session;
      const updated = action.accept
        ? {
            ...original,
            scheduledAt: proposal.scheduledAt,
            timeZone: proposal.timeZone,
            scheduleHistory: [
              ...(session.scheduleHistory ?? []),
              {
                scheduledAt: session.scheduledAt,
                timeZone: session.timeZone ?? DEFAULT_TIME_ZONE,
                replacedAt: now,
              },
            ],
          }
        : original;
      return {
        ok: true,
        message: action.accept
          ? "Nuevo horario aceptado por ambos. Reserva actualizada."
          : "Propuesta rechazada. Se conserva el horario original.",
        state: {
          ...state,
          sessions: state.sessions.map((s) => (s.id === session.id ? updated : s)),
        },
      };
    }
    case "startAttention":
    case "endAttention": {
      const session = state.sessions.find((s) => s.id === action.sessionId);
      if (!session || session.mentorId !== action.userId)
        return fail("Solo quien brinda la ayuda puede registrar la atención.");
      if (session.status !== "accepted" || !session.attentionFlow)
        return fail("Esta sesión no requiere registrar atención inmediata.");
      if (action.type === "startAttention" && session.attentionStartedAt !== undefined)
        return fail("La atención ya comenzó.");
      if (
        action.type === "endAttention" &&
        (session.attentionStartedAt === undefined ||
          session.attentionEndedAt !== undefined ||
          now <= session.attentionStartedAt)
      )
        return fail("Registra primero el inicio de la atención.");
      return {
        ok: true,
        message:
          action.type === "startAttention"
            ? "Atención iniciada."
            : "Atención terminada. Ambos pueden confirmar la ayuda realizada.",
        state: withNotifications(
          {
            ...state,
            sessions: state.sessions.map((s) =>
              s.id === session.id
                ? {
                    ...s,
                    ...(action.type === "startAttention"
                      ? { attentionStartedAt: now }
                      : { attentionEndedAt: now }),
                  }
                : s,
            ),
          },
          action.type === "endAttention"
            ? [session.learnerId, session.mentorId].map((userId) => ({
                eventKey: `session:${session.id}:confirmation:${userId}`,
                userId,
                sessionId: session.id,
                kind: "confirmation" as const,
                title: "Confirma tu asesoría",
                body: `La atención de «${session.topic}» terminó. Confirma para completar el intercambio.`,
              }))
            : [],
          now,
        ),
      };
    }
  }
}

export function availabilityError(availability: Availability): string | null {
  if (!Array.isArray(availability)) return "Disponibilidad no válida.";
  for (const slot of availability) {
    if (!slot || !WEEK_ORDER.includes(slot.day)) return "Día disponible no válido.";
    const name = DAY_LONG[slot.day];
    const validTime = (time: string) =>
      typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    if (!validTime(slot.from) || !validTime(slot.to))
      return `${name}: completa las horas Desde y Hasta.`;
    if (slot.to <= slot.from) return `${name}: Hasta debe ser posterior a Desde.`;
  }
  for (const day of WEEK_ORDER) {
    const slots = availability
      .filter((s) => s.day === day)
      .sort((a, b) => a.from.localeCompare(b.from));
    for (let i = 1; i < slots.length; i++) {
      const previous = slots[i - 1],
        current = slots[i];
      if (previous && current && current.from < previous.to)
        return `${DAY_LONG[day]}: las franjas no pueden superponerse.`;
    }
  }
  return null;
}

function withinAvailability(profile: Profile, start: number, minutes: number): boolean {
  const zone = profile.timeZone ?? DEFAULT_TIME_ZONE;
  const parts = localParts(start, zone),
    end = localParts(start + minutes * 60000, zone);
  return (
    parts.second === 0 &&
    parts.millisecond === 0 &&
    parts.date === end.date &&
    !(profile.blockedDates ?? []).includes(parts.date) &&
    profile.availability.some(
      (s) => s.day === parts.day && s.from <= parts.time && s.to >= end.time,
    )
  );
}

export function schedulingError(
  state: DemoState,
  learnerId: UserId,
  mentorId: UserId,
  start: number,
  minutes: number,
  now = Date.now(),
  excludeSessionId?: string,
): string | null {
  const mentor = state.profiles[mentorId],
    learner = state.profiles[learnerId];
  if (!mentor || !learner || !Number.isSafeInteger(start) || start <= now || !isDuration(minutes))
    return "Selecciona una fecha y hora futuras válidas.";
  if (!withinAvailability(mentor, start, minutes))
    return "El horario no está disponible o la duración no cabe en la franja del mentor.";
  if (
    (learner.blockedDates ?? []).includes(
      localParts(start, learner.timeZone ?? DEFAULT_TIME_ZONE).date,
    )
  )
    return "Tienes esa fecha bloqueada en tu perfil.";
  const end = start + minutes * 60000;
  const overlap = state.sessions.some(
    (s) =>
      s.id !== excludeSessionId &&
      s.status === "accepted" &&
      s.scheduledAt !== undefined &&
      (s.learnerId === learnerId ||
        s.mentorId === learnerId ||
        s.learnerId === mentorId ||
        s.mentorId === mentorId) &&
      s.scheduledAt < end &&
      s.scheduledAt + s.minutes * 60000 > start,
  );
  const projected = [learnerId, mentorId].some((id) =>
    state.busySlots?.[id]?.some((s) => s.start < end && s.end > start),
  );
  if (overlap || projected) return "Ese horario ya está reservado. Selecciona otro.";
  return null;
}

export function bookableSlots(
  state: DemoState,
  learnerId: UserId,
  mentorId: UserId,
  date: string,
  minutes: number,
  now = Date.now(),
  excludeSessionId?: string,
): number[] {
  const mentor = state.profiles[mentorId];
  if (!mentor || !validDate(date) || !isDuration(minutes)) return [];
  const slots: number[] = [];
  for (const slot of mentor.availability.filter((s) => s.day === dateDay(date))) {
    const from = localInstant(date, slot.from, mentor.timeZone ?? DEFAULT_TIME_ZONE),
      to = localInstant(date, slot.to, mentor.timeZone ?? DEFAULT_TIME_ZONE);
    if (from === null || to === null) continue;
    for (let at = from; at + minutes * 60000 <= to; at += 15 * 60000)
      if (!schedulingError(state, learnerId, mentorId, at, minutes, now, excludeSessionId))
        slots.push(at);
  }
  return [...new Set(slots)].sort((a, b) => a - b);
}

export function nextScheduledSession(
  state: DemoState,
  userId: UserId,
  now = Date.now(),
): Session | undefined {
  return state.sessions
    .filter(
      (s) =>
        s.status === "accepted" &&
        s.scheduledAt !== undefined &&
        s.scheduledAt >= now &&
        (s.learnerId === userId || s.mentorId === userId),
    )
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))[0];
}
