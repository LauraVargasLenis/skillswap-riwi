import { profileOf } from "@/lib/skillswap/profile";
import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, Compass, LifeBuoy, RotateCcw, User } from "lucide-react";
import type { ReactNode } from "react";

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
import { availableOf } from "@/lib/skillswap/engine";
import { USER_IDS } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { cn } from "@/lib/utils";

import { UserAvatar } from "./avatar";
import { Logo } from "./bits";
import { AccountControls } from "./account-controls";
import { TopupDialog } from "./topup-dialog";
import { RequestSessionDialog } from "./request-session-dialog";
import { useTesting } from "@/lib/skillswap/testing-context";
import { NotificationCenter } from "./notification-center";
import { PresentationControl, PresentationPanel } from "./presentation-panel";
import { ModerationPanel } from "./moderation-panel";

const NAV = [
  { to: "/", label: "Explorar", short: "Explorar", icon: Compass },
  { to: "/rescates", label: "Rescates", short: "Rescates", icon: LifeBuoy },
  { to: "/intercambios", label: "Mis intercambios", short: "Intercambios", icon: ArrowLeftRight },
  { to: "/perfil", label: "Mi perfil", short: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-5 py-8 lg:flex">
        <Logo className="mb-10 px-2" />
        <nav aria-label="Principal" className="flex flex-col gap-1.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-sidebar-foreground transition-colors hover:bg-brand-softer data-[status=active]:bg-sidebar-accent data-[status=active]:font-semibold"
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <TestBanner />
        <WelcomeNudge />
        <PresentationPanel />
        <main
          id="contenido"
          className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 sm:px-8 lg:pb-12"
        >
          {children}
        </main>
      </div>

      <nav
        aria-label="Principal móvil"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV.map(({ to, short, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="m-1.5 flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-muted-foreground data-[status=active]:bg-mint-soft data-[status=active]:text-foreground"
          >
            <Icon className="size-5" aria-hidden />
            {short}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function TopBar() {
  const { state, real } = useApp();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-8">
        <Logo className="text-xl lg:hidden max-sm:[&>span:last-child]:sr-only [&>span:first-child]:size-8" />
        <div className="ml-auto flex items-center gap-1 sm:gap-3">
          <AccountControls />
          <div className="hidden sm:block">
            <TopupDialog />
          </div>
          {real ? (
            <span className="hidden text-sm font-semibold sm:inline">
              {state?.profiles[state.activeUserId]?.name}
            </span>
          ) : (
            <ProfileSwitcher />
          )}
          <NotificationCenter />
          <ModerationPanel />
          {!real && <ResetDemo />}
        </div>
      </div>
    </header>
  );
}

function TestBanner() {
  const { state, testing } = useApp();
  const { exit } = useTesting();
  const { enabled } = useTesting();
  if (!testing) return null;
  const draft = state?.requestDrafts?.[state.activeUserId];
  const mentor = draft && state?.profiles[draft.mentorId];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-warning-soft px-4 py-3 text-warning-foreground sm:px-8">
      <strong className="text-sm">Demo · Simulación · Sin cobros ni saldos reales</strong>
      <div className="flex flex-wrap gap-2">
        <PresentationControl />
        {draft && mentor && state && (
          <RequestSessionDialog
            key={`${state.activeUserId}-${draft.mentorId}`}
            mentor={mentor}
            state={state}
            resume
          />
        )}
        {enabled && (
          <Button variant="outline" size="sm" onClick={exit}>
            Salir del modo de prueba
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileSwitcher() {
  const { state, act } = useApp();
  if (!state) return <div className="h-11 w-40 animate-pulse rounded-full bg-muted" />;

  return (
    <fieldset className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-3 pr-1 shadow-card">
      <legend className="sr-only">Perfil de prueba activo</legend>
      <span className="hidden text-xs font-medium text-muted-foreground md:inline" aria-hidden>
        Ver como
      </span>
      <div className="flex items-center gap-1">
        {USER_IDS.map((id) => {
          const p = profileOf(state, id);
          const active = state.activeUserId === id;
          return (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full p-0.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                active ? "bg-brand-soft sm:pr-3" : "hover:bg-brand-softer",
              )}
            >
              <input
                type="radio"
                name="perfil-activo"
                value={id}
                checked={active}
                onChange={() => act({ type: "switchUser", userId: id })}
                className="sr-only"
              />
              <UserAvatar
                userId={id}
                name={p.name}
                src={p.photoUrl}
                size="xs"
                className={cn(active ? "ring-2 ring-brand" : "opacity-70 grayscale-[30%]")}
              />
              <span
                className={cn(
                  "text-sm font-semibold",
                  active ? "sr-only sm:not-sr-only" : "sr-only",
                )}
              >
                {p.name}
                <span className="ml-1.5 hidden font-medium text-mint-foreground sm:inline">
                  {availableOf(state, id)} min
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ResetDemo() {
  const { act } = useApp();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Reiniciar demo" title="Reiniciar demo">
          <RotateCcw aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Reiniciar la demo?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran rescates, sesiones y movimientos. Emmanuel vuelve a 30 min con su duda de CSS,
            Laura a 0 min, Juan Daniel a 30 min y Juan Manuel a 75 min ganados de demo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => act({ type: "reset" })}>Reiniciar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WelcomeNudge() {
  const { state, real } = useApp();
  if (!state || !real || state.onboarding?.[state.activeUserId]?.completed) return null;
  const step = state.onboarding?.[state.activeUserId]?.step ?? 0;
  return <div className="border-b border-brand/20 bg-brand-softer px-4 py-3 text-sm sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
      <p><strong>Bienvenido a SkillSwap.</strong> Configura tu perfil para encontrar ayuda relevante (paso {Math.min(step + 1, 5)} de 5).</p>
      <Button asChild size="sm"><Link to="/perfil">Continuar bienvenida</Link></Button>
    </div>
  </div>;
}
