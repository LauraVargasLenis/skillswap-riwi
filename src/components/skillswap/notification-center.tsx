import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, CheckCheck, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ago } from "@/lib/skillswap/format";
import { syncSharedNotifications } from "@/lib/skillswap/accounts.functions";
import { useApp } from "@/lib/skillswap/use-app";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { state, act, real } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sync = useServerFn(syncSharedNotifications);
  const me = state?.activeUserId;
  const notifications = (state?.notifications ?? [])
    .filter((notification) => notification.userId === me)
    .sort((a, b) => b.createdAt - a.createdAt);
  const unread = notifications.filter((notification) => notification.readAt === undefined).length;

  useEffect(() => {
    if (!me) return;
    let active = true;
    const update = async () => {
      if (real) {
        const result = await sync();
        if (active && result.ok && result.changed)
          await queryClient.invalidateQueries({ queryKey: ["shared"] });
      } else await act({ type: "syncNotifications", userId: me }, { silent: true });
    };
    void update();
    const interval = window.setInterval(() => void update(), 30_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [me, real, sync, act, queryClient]);

  async function openNotification(id: string, sessionId: string, chat: boolean, rescue = false) {
    if (!me || busy) return;
    setBusy(true);
    await act({ type: "markNotificationRead", userId: me, notificationId: id }, { silent: true });
    setBusy(false);
    setOpen(false);
    if (rescue) await navigate({ to: "/rescates" });
    else await navigate({ to: "/intercambios", search: { session: sessionId, chat } });
  }

  async function markAll() {
    if (!me || busy || unread === 0) return;
    setBusy(true);
    await act({ type: "markAllNotificationsRead", userId: me }, { silent: true });
    setBusy(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={
            unread ? `${unread} notificaciones sin leer` : "Notificaciones, ninguna sin leer"
          }
        >
          <Bell className="size-5" aria-hidden />
          {unread > 0 && (
            <span className="absolute right-0 top-0 grid min-w-4 place-items-center rounded-full bg-mint px-1 text-[10px] font-bold text-foreground">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1rem))] rounded-2xl p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display font-semibold">Notificaciones</h2>
            <p className="text-xs text-muted-foreground">
              {unread ? `${unread} pendientes por leer` : "Estás al día"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || unread === 0}
            onClick={() => void markAll()}
          >
            <CheckCheck className="size-4" aria-hidden /> Marcar leídas
          </Button>
        </div>
        <div className="max-h-[min(30rem,65dvh)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Bell className="mx-auto size-7 text-brand" aria-hidden />
              <p className="mt-3 text-sm font-medium">Aún no tienes notificaciones</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Las solicitudes, mensajes y confirmaciones aparecerán aquí.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notification) => {
                const isUnread = notification.readAt === undefined;
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void openNotification(
                          notification.id,
                          notification.sessionId,
                          notification.kind === "message",
                          notification.kind === "rescue",
                        )
                      }
                      className={cn(
                        "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-softer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        isUnread && "bg-brand-softer/60",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-full",
                          isUnread ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {notification.kind === "message" ? (
                          <MessageCircle className="size-4" aria-hidden />
                        ) : (
                          <Bell className="size-4" aria-hidden />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <strong className="min-w-0 flex-1 text-sm">{notification.title}</strong>
                          {isUnread && (
                            <span
                              className="mt-1.5 size-2 shrink-0 rounded-full bg-brand"
                              aria-label="Sin leer"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 block break-words text-xs text-muted-foreground">
                          {notification.body}
                        </span>
                        <span
                          className="mt-1 block text-[11px] text-muted-foreground"
                          title={new Date(notification.createdAt).toLocaleString("es-CO")}
                        >
                          {ago(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
