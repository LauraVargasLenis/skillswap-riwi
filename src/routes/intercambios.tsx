import { profileOf } from "@/lib/skillswap/profile";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Gift,
  Inbox,
  Lock,
  MessageCircle,
  Send,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { UserAvatar } from "@/components/skillswap/avatar";
import {
  EmptyState,
  PageHeader,
  PageSkeleton,
  Pill,
  SectionTitle,
  SessionStatusPill,
} from "@/components/skillswap/bits";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { availableOf, balanceOf, earnedAvailableOf, reservedOf } from "@/lib/skillswap/engine";
import { ago } from "@/lib/skillswap/format";
import type { DemoState, Session } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { cn } from "@/lib/utils";
import { TopupDialog } from "@/components/skillswap/topup-dialog";
import { cop } from "@/components/skillswap/topup-dialog";
import { WithdrawDialog } from "@/components/skillswap/withdraw-dialog";
import { RescheduleDialog } from "@/components/skillswap/reschedule-dialog";
import { scheduledLabel } from "@/lib/skillswap/time";
import { ChatDialog } from "@/components/skillswap/chat-dialog";
import { AdminDemoFinish } from "@/components/skillswap/admin-demo-finish";
import { SessionReview, ReportSessionDialog } from "@/components/skillswap/session-feedback";

export const Route = createFileRoute("/intercambios")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search["session"] === "string" ? { session: search["session"] } : {}),
    ...(search["chat"] === true || search["chat"] === "true" ? { chat: true } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Mis intercambios — SkillSwap" },
      {
        name: "description",
        content:
          "Tus sesiones pendientes, confirmaciones, saldo en minutos e historial de movimientos.",
      },
      { property: "og:title", content: "Mis intercambios — SkillSwap" },
      {
        property: "og:description",
        content:
          "Tus sesiones pendientes, confirmaciones, saldo en minutos e historial de movimientos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntercambiosPage,
});

function IntercambiosPage() {
  const { state } = useApp();
  const search = Route.useSearch();
  const [chatId, setChatId] = useState<string | null>(null);
  useEffect(() => {
    if (search.chat && search.session) setChatId(search.session);
    if (search.session)
      document.getElementById(`session-${search.session}`)?.scrollIntoView({ block: "center" });
  }, [search.chat, search.session]);
  if (!state) return <PageSkeleton />;
  const me = state.activeUserId;
  const chatSession = state.sessions.find(
    (session) => session.id === chatId && (session.learnerId === me || session.mentorId === me),
  );

  const toAnswer = state.sessions.filter((s) => s.status === "pending" && s.mentorId === me);
  const toConfirm = state.sessions.filter(
    (s) => s.status === "accepted" && (s.learnerId === me || s.mentorId === me),
  );
  const sent = state.sessions.filter((s) => s.status === "pending" && s.learnerId === me);
  const past = state.sessions.filter(
    (s) =>
      ["completed", "declined", "cancelled"].includes(s.status) &&
      (s.learnerId === me || s.mentorId === me),
  );

  return (
    <div className="animate-pop-in">
      <PageHeader
        title="Mis intercambios"
        subtitle={`Lo que tienes en curso como ${profileOf(state, me).name}. Los minutos pasan de quien recibe ayuda a quien la da cuando ambos confirman.`}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-10">
          <Section title="Necesitan tu respuesta" count={toAnswer.length}>
            {toAnswer.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-6" />}
                title="Nadie te ha pedido una sesión todavía"
              >
                Las solicitudes que te envíen desde Explorar aparecen aquí.
              </EmptyState>
            ) : (
              toAnswer.map((s) => (
                <RequestCard key={s.id} session={s} state={state} onChat={setChatId} />
              ))
            )}
          </Section>

          <Section title="Sesiones por confirmar" count={toConfirm.length}>
            {toConfirm.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="size-6" />}
                title="No tienes sesiones aceptadas"
              >
                Acepta un rescate o una solicitud para empezar.
              </EmptyState>
            ) : (
              toConfirm.map((s) => (
                <ConfirmCard key={s.id} session={s} state={state} onChat={setChatId} />
              ))
            )}
          </Section>

          <Section title="Solicitudes enviadas" count={sent.length}>
            {sent.length === 0 ? (
              <EmptyState icon={<Send className="size-6" />} title="No has enviado solicitudes">
                <Link
                  to="/"
                  className="font-semibold text-brand underline-offset-4 hover:underline"
                >
                  Busca a alguien en Explorar
                </Link>
              </EmptyState>
            ) : (
              sent.map((s) => <SentCard key={s.id} session={s} state={state} onChat={setChatId} />)
            )}
          </Section>

          {past.length > 0 && (
            <Section title="Sesiones anteriores">
              <ul className="card-surface divide-y divide-border">
                {past.map((s) => {
                  const other = profileOf(state, s.learnerId === me ? s.mentorId : s.learnerId);
                  return (
                    <li
                      key={s.id}
                      id={`session-${s.id}`}
                      className="flex items-center gap-3 px-5 py-3 text-sm"
                    >
                      <UserAvatar userId={other.id} src={other.photoUrl} name={other.name} size="xs" />
                      <span className="min-w-0 flex-1 truncate">
                        <strong>{s.topic}</strong> con {other.name} · {s.minutes} min
                        {s.scheduledAt !== undefined && (
                          <span className="block text-xs text-muted-foreground">
                            {scheduledLabel(s.scheduledAt, profileOf(state, me).timeZone)}
                          </span>
                        )}
                      </span>
                      <SessionStatusPill status={s.status} />
                      {s.status === "completed" && <SessionReview session={s} />}
                      <ReportSessionDialog session={s} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setChatId(s.id)}
                        aria-label={`Abrir conversación de ${s.topic}`}
                      >
                        <MessageCircle className="size-4" aria-hidden />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}
        </div>

        <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <BalancePanel state={state} />
          <History state={state} />
        </aside>
      </div>
      {chatSession && (
        <ChatDialog
          session={chatSession}
          state={state}
          open={Boolean(chatSession)}
          onOpenChange={(open) => {
            if (!open) setChatId(null);
          }}
        />
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section>
      <SectionTitle>
        {title}
        {count ? (
          <span className="ml-2 inline-grid min-w-6 place-items-center rounded-full bg-mint px-1.5 align-middle text-xs font-bold text-foreground">
            {count}
          </span>
        ) : null}
      </SectionTitle>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function useOnce() {
  const [busy, setBusy] = useState(false);
  const { act } = useApp();
  const run = async (...args: Parameters<typeof act>) => {
    if (busy) return;
    setBusy(true);
    await act(...args);
    setBusy(false);
  };
  return { busy, run };
}

function SessionHead({
  session,
  state,
  otherId,
  role,
}: {
  session: Session;
  state: DemoState;
  otherId: Session["learnerId"];
  role: string;
}) {
  const other = profileOf(state, otherId);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <UserAvatar userId={other.id} src={other.photoUrl} name={other.name} size="md" />
        <div className="min-w-0">
          <h3 className="break-words font-display text-lg font-semibold leading-tight">
            {session.topic}
          </h3>
          <p className="text-sm text-muted-foreground">
            {role} {other.name} · {session.origin === "rescue" ? "Rescate" : "Desde Explorar"} ·{" "}
            {ago(session.createdAt)}
          </p>
          <p className="mt-1 break-words text-sm font-medium text-brand">
            {session.scheduledAt !== undefined
              ? scheduledLabel(session.scheduledAt, state.profiles[state.activeUserId]?.timeZone)
              : session.attentionFlow
                ? "Rescate inmediato"
                : "Sin fecha · Intercambio anterior"}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {session.demo && <Pill tone="muted">Demo</Pill>}
        <Pill tone="mint">
          <Clock className="size-3.5" aria-hidden /> {session.minutes} min
        </Pill>
      </div>
    </div>
  );
}

function RequestCard({
  session,
  state,
  onChat,
}: {
  session: Session;
  state: DemoState;
  onChat: (id: string) => void;
}) {
  const { busy, run } = useOnce();
  const { real } = useApp();
  const learner = profileOf(state, session.learnerId);
  const learnerAvailable = availableOf(state, learner.id);
  const canAfford = real || learnerAvailable >= session.minutes;
  return (
    <article id={`session-${session.id}`} className="card-surface scroll-mt-28 p-5">
      <SessionHead session={session} state={state} otherId={learner.id} role="Te lo pide" />
      {session.note && (
        <p className="mt-3 rounded-xl bg-muted px-3 py-2 text-sm">“{session.note}”</p>
      )}
      <p
        className={cn(
          "mt-3 text-sm",
          canAfford ? "text-muted-foreground" : "font-medium text-warning-foreground",
        )}
      >
        {canAfford
          ? `Al aceptar se reservan ${session.minutes} min de ${learner.name}. Los recibes cuando ambos confirmen.`
          : `${learner.name} tiene ${learnerAvailable} min disponibles y necesita ${session.minutes}. No puedes aceptar todavía.`}
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={() => onChat(session.id)}>
          <MessageCircle aria-hidden /> Abrir chat
        </Button>
        <ReportSessionDialog session={session} />
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            run({
              type: "respondSession",
              userId: state.activeUserId,
              sessionId: session.id,
              accept: false,
            })
          }
        >
          Rechazar
        </Button>
        <Button
          disabled={busy || !canAfford}
          onClick={() =>
            run({
              type: "respondSession",
              userId: state.activeUserId,
              sessionId: session.id,
              accept: true,
            })
          }
        >
          Aceptar sesión
        </Button>
      </div>
    </article>
  );
}

function ConfirmCard({
  session,
  state,
  onChat,
}: {
  session: Session;
  state: DemoState;
  onChat: (id: string) => void;
}) {
  const { busy, run } = useOnce();
  const me = state.activeUserId;
  const iAmLearner = session.learnerId === me;
  const otherId = iAmLearner ? session.mentorId : session.learnerId;
  const iConfirmed = iAmLearner ? session.learnerConfirmed : session.mentorConfirmed;
  const learner = profileOf(state, session.learnerId);
  const mentor = profileOf(state, session.mentorId);
  const tooEarly =
    !session.earlyDemo &&
    session.scheduledAt !== undefined &&
    Date.now() < session.scheduledAt + session.minutes * 60000;
  const waitingAttention = session.attentionFlow && session.attentionEndedAt === undefined;

  return (
    <article id={`session-${session.id}`} className="card-surface scroll-mt-28 p-5">
      <SessionHead
        session={session}
        state={state}
        otherId={otherId}
        role={iAmLearner ? "Te ayuda" : "Ayudas a"}
      />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ConfirmRow name={learner.name} role="Recibe ayuda" done={session.learnerConfirmed} />
        <ConfirmRow name={mentor.name} role="Da la ayuda" done={session.mentorConfirmed} />
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="size-4 shrink-0" aria-hidden />
        {session.minutes} min reservados de {learner.name}. Pasan a {mentor.name} cuando ambos
        confirmen.
      </p>
      {iAmLearner && session.reservedSources && (
        <p className="mt-2 text-xs text-muted-foreground">
          Reserva: {session.reservedSources.regular} min de bienvenida o recarga ·{" "}
          {session.reservedSources.earned} min ganados.
        </p>
      )}
      {session.reschedule && (
        <div className="mt-4 space-y-2 border-t border-border pt-3">
          <p className="text-sm font-semibold">
            Horario propuesto:{" "}
            {scheduledLabel(session.reschedule.scheduledAt, session.reschedule.timeZone)}
          </p>
          {session.reschedule.proposedBy === me ? (
            <p className="text-sm text-muted-foreground">
              Esperando respuesta. Tu reserva original sigue vigente.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  run({
                    type: "respondReschedule",
                    userId: me,
                    sessionId: session.id,
                    accept: false,
                  })
                }
              >
                Mantener horario original
              </Button>
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  run({
                    type: "respondReschedule",
                    userId: me,
                    sessionId: session.id,
                    accept: true,
                  })
                }
              >
                Aceptar nuevo horario
              </Button>
            </div>
          )}
        </div>
      )}
      {session.earlyDemo && (
        <p role="status" className="mt-3 rounded-xl bg-brand-softer px-3 py-2 text-sm">
          Cierre anticipado de demostración registrado. Las confirmaciones y la transferencia siguen
          las reglas habituales.
        </p>
      )}
      {tooEarly && (
        <p role="status" className="mt-3 text-sm text-muted-foreground">
          La confirmación estará disponible al terminar la sesión programada.
        </p>
      )}
      {waitingAttention && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {session.attentionStartedAt === undefined
              ? "Atención pendiente de iniciar."
              : "Atención en curso."}
          </p>
          {!iAmLearner && (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() =>
                run({
                  type:
                    session.attentionStartedAt === undefined ? "startAttention" : "endAttention",
                  userId: me,
                  sessionId: session.id,
                })
              }
            >
              {session.attentionStartedAt === undefined
                ? "Iniciar atención"
                : "Registrar atención terminada"}
            </Button>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => onChat(session.id)}>
          <MessageCircle aria-hidden /> Abrir chat
        </Button>
        <ReportSessionDialog session={session} />
        <AdminDemoFinish session={session} state={state} />
        {session.scheduledAt !== undefined &&
          !session.reschedule &&
          !session.learnerConfirmed &&
          !session.mentorConfirmed && <RescheduleDialog session={session} state={state} />}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={busy}>
              Cancelar sesión
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar esta sesión?</AlertDialogTitle>
              <AlertDialogDescription>
                Se liberarán {session.minutes} minutos. La cancelación quedará en el historial
                {session.rescueId ? " y el rescate volverá a abrirse" : ""}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Volver</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => run({ type: "cancelSession", userId: me, sessionId: session.id })}
              >
                Sí, cancelar sesión
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {iConfirmed ? (
          <p className="text-sm font-medium text-mint-foreground" role="status">
            Ya confirmaste. Esperando a {profileOf(state, otherId).name}.
          </p>
        ) : (
          <Button
            disabled={busy || tooEarly || Boolean(waitingAttention)}
            onClick={() => run({ type: "confirmSession", userId: me, sessionId: session.id })}
          >
            <CheckCircle2 aria-hidden /> Confirmar sesión realizada
          </Button>
        )}
      </div>
    </article>
  );
}

function ConfirmRow({ name, role, done }: { name: string; role: string; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-sm",
        done ? "bg-mint-soft" : "bg-muted",
      )}
    >
      {done ? (
        <CheckCircle2 className="size-4 text-mint-foreground" aria-hidden />
      ) : (
        <Circle className="size-4 text-muted-foreground" aria-hidden />
      )}
      <span>
        <strong>{name}</strong> <span className="text-muted-foreground">· {role}</span>
      </span>
      <span className="sr-only">{done ? "confirmó" : "no ha confirmado"}</span>
    </div>
  );
}

function SentCard({
  session,
  state,
  onChat,
}: {
  session: Session;
  state: DemoState;
  onChat: (id: string) => void;
}) {
  const { busy, run } = useOnce();
  const mentor = profileOf(state, session.mentorId);
  return (
    <article id={`session-${session.id}`} className="card-surface scroll-mt-28 p-5">
      <SessionHead session={session} state={state} otherId={mentor.id} role="Pediste a" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Esperando respuesta de {mentor.name}. Aún no se mueven minutos.
        </p>
        <Button variant="ghost" size="sm" onClick={() => onChat(session.id)}>
          <MessageCircle aria-hidden /> Abrir chat
        </Button>
        <ReportSessionDialog session={session} />
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() =>
            run({ type: "cancelRequest", userId: state.activeUserId, sessionId: session.id })
          }
        >
          Cancelar solicitud
        </Button>
      </div>
    </article>
  );
}

function BalancePanel({ state }: { state: DemoState }) {
  const me = state.activeUserId;
  const balance = balanceOf(state, me);
  const reserved = reservedOf(state, me);
  const available = availableOf(state, me);
  return (
    <section aria-labelledby="saldo" className="card-surface overflow-hidden">
      <div className="bg-gradient-mint p-6">
        <h2 id="saldo" className="flex items-center gap-2 text-base font-semibold">
          <Wallet className="size-5 shrink-0" aria-hidden /> Minutos disponibles para aprender
        </h2>
        <p className="mt-2 font-display text-5xl font-bold" aria-live="polite">
          {available}
          <span className="ml-2 text-xl font-semibold">min</span>
        </p>
        <div className="mt-4">
          <TopupDialog />
        </div>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-border text-sm">
        <div className="p-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Coins className="size-4" aria-hidden /> Saldo total
          </dt>
          <dd className="mt-1 font-display text-2xl font-bold">{balance} min</dd>
        </div>
        <div className="p-4">
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden /> Minutos reservados
          </dt>
          <dd className="mt-1 font-display text-2xl font-bold">{reserved} min</dd>
        </div>
      </dl>
      <div className="space-y-3 border-t border-border p-4">
        <dl>
          <dt className="text-sm font-semibold">Minutos ganados disponibles para retiro</dt>
          <dd className="mt-1 font-display text-2xl font-bold text-mint-foreground">
            {earnedAvailableOf(state, me)} min
          </dd>
        </dl>
        <p className="text-xs text-muted-foreground">
          Son parte de los {available} min disponibles para aprender; no se suman de nuevo.
        </p>
        <WithdrawDialog />
      </div>
    </section>
  );
}

function History({ state }: { state: DemoState }) {
  const me = state.activeUserId;
  const items = state.movements
    .filter((m) => m.toId === me || m.fromId === me)
    .sort((a, b) => b.at - a.at);
  return (
    <section aria-labelledby="historial" className="card-surface p-5">
      <h2 id="historial" className="mb-3 text-lg font-bold">
        Historial de movimientos
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no tienes movimientos. Ayuda a alguien para ganar tus primeros minutos.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m) => {
            const incoming = m.toId === me;
            const Icon = m.kind === "welcome" ? Gift : incoming ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={m.id} className="flex items-center gap-3 py-3 text-sm">
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    incoming ? "bg-mint-soft text-mint-foreground" : "bg-brand-soft text-primary",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">
                    {m.kind === "withdrawal"
                      ? "Retiro simbólico"
                      : m.kind === "topup"
                        ? "Recarga simbólica"
                        : m.kind === "welcome"
                          ? "Minutos de bienvenida"
                          : incoming
                            ? "Minutos ganados"
                            : "Minutos usados"}
                  </span>
                  {(m.kind === "withdrawal" || m.kind === "topup") && m.priceCop !== undefined && (
                    <span className="block text-xs text-muted-foreground">
                      {cop(m.priceCop)} COP · Simulación
                    </span>
                  )}
                  {m.kind === "earned" && (
                    <span className="block text-xs text-muted-foreground">{m.concept}</span>
                  )}
                  {m.kind === "session" && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {m.concept}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{ago(m.at)}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-display font-bold",
                    incoming ? "text-mint-foreground" : "text-primary",
                  )}
                >
                  {incoming ? "+" : "−"}
                  {m.minutes} min
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
