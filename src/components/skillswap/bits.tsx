import { Link } from "@tanstack/react-router";
import { Repeat } from "lucide-react";
import type { ReactNode } from "react";

import type { RescueStatus, SessionStatus } from "@/lib/skillswap/types";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn("flex items-center gap-2 rounded-lg font-display text-2xl font-bold", className)}
      aria-label="SkillSwap, ir a Explorar"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-mint-soft text-mint">
        <Repeat className="size-6" strokeWidth={3} aria-hidden />
      </span>
      <span className="text-foreground">SkillSwap</span>
    </Link>
  );
}

const TONES = {
  brand: "bg-brand-soft text-primary",
  warning: "bg-warning-soft text-warning-foreground",
  mint: "bg-mint-soft text-mint-foreground",
  muted: "bg-muted text-muted-foreground",
};

export function Pill({
  tone,
  children,
  dot,
  className,
}: {
  tone: keyof typeof TONES;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export function RescueStatusPill({ status }: { status: RescueStatus }) {
  const map: Record<RescueStatus, [keyof typeof TONES, string]> = {
    open: ["brand", "Abierto"],
    accepted: ["warning", "Aceptado"],
    completed: ["mint", "Completado"],
    withdrawn: ["muted", "Retirado"],
  };
  const [tone, label] = map[status];
  return (
    <Pill tone={tone} dot>
      {label}
    </Pill>
  );
}

export function SessionStatusPill({ status }: { status: SessionStatus }) {
  const map: Record<SessionStatus, [keyof typeof TONES, string]> = {
    pending: ["brand", "Pendiente"],
    accepted: ["warning", "Aceptada"],
    completed: ["mint", "Completada"],
    declined: ["muted", "Rechazada"],
    cancelled: ["muted", "Cancelada"],
  };
  const [tone, label] = map[status];
  return (
    <Pill tone={tone} dot>
      {label}
    </Pill>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="h-10 w-2/3 animate-pulse rounded-xl bg-muted" />
      <div className="h-5 w-1/2 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-brand-soft text-brand">{icon}</div>
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-4 text-xl font-bold sm:text-2xl">
      {children}
    </h2>
  );
}
