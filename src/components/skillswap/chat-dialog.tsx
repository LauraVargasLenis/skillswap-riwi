import { useEffect, useRef, useState } from "react";
import { ExternalLink, MessageCircle, Send, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { profileOf } from "@/lib/skillswap/profile";
import type { DemoState, Session } from "@/lib/skillswap/types";
import { useApp } from "@/lib/skillswap/use-app";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./avatar";

function MessageBody({ body }: { body: string }) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {parts.map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-brand underline underline-offset-2"
          >
            {part.replace(/^https?:\/\//, "")}{" "}
            <ExternalLink className="inline size-3" aria-hidden />
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

export function ChatDialog({
  session,
  state,
  open,
  onOpenChange,
}: {
  session: Session;
  state: DemoState;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { act } = useApp();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [meetOpen, setMeetOpen] = useState(false);
  const [meetUrl, setMeetUrl] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const me = state.activeUserId;
  const otherId = session.learnerId === me ? session.mentorId : session.learnerId;
  const other = profileOf(state, otherId);
  const messages = (state.messages ?? [])
    .filter((message) => message.sessionId === session.id)
    .sort((a, b) => a.createdAt - b.createdAt);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages.length]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError("");
    const ok = await act({
      type: "sendMessage",
      userId: me,
      sessionId: session.id,
      body: text,
      clientId: crypto.randomUUID(),
    });
    if (ok) {
      setBody("");
      setMeetUrl("");
      setMeetOpen(false);
    } else setError("No se envió el mensaje. Tu texto sigue aquí para reintentar.");
    setBusy(false);
  }

  function shareMeet() {
    try {
      const url = new URL(meetUrl.trim());
      if (url.protocol !== "https:" || url.hostname !== "meet.google.com") throw new Error();
      void send(`Enlace de Google Meet: ${url.toString()}`);
    } catch {
      setError("Pega un enlace válido que comience con https://meet.google.com/.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(82dvh,46rem)] w-[calc(100vw-1rem)] max-w-2xl grid-rows-none flex-col gap-0 overflow-hidden rounded-2xl p-0 max-sm:left-0 max-sm:top-0 max-sm:h-dvh max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 font-display">
            <MessageCircle className="size-5 text-brand" aria-hidden /> Conversación del intercambio
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <UserAvatar userId={other.id} name={other.name} size="xs" />
            <span className="min-w-0 truncate">
              {session.topic} · con {other.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
          aria-live="polite"
          aria-label="Mensajes"
        >
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <MessageCircle className="mx-auto size-8 text-brand" aria-hidden />
                <p className="mt-3 font-semibold">Empiecen la conversación</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solo ustedes dos pueden leer y escribir aquí.
                </p>
              </div>
            </div>
          ) : (
            <ol className="space-y-4">
              {messages.map((message) => {
                const own = message.senderId === me;
                const sender = profileOf(state, message.senderId);
                return (
                  <li key={message.id} className={cn("flex gap-2", own && "justify-end")}>
                    {!own && (
                      <UserAvatar
                        userId={sender.id}
                        name={sender.name}
                        size="xs"
                        className="mt-1"
                      />
                    )}
                    <div className={cn("max-w-[85%] sm:max-w-[75%]", own && "text-right")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-left",
                          own ? "rounded-br-md bg-brand-soft" : "rounded-bl-md bg-muted",
                        )}
                      >
                        <MessageBody body={message.body} />
                      </div>
                      <p className="mt-1 px-1 text-[11px] text-muted-foreground">
                        {own ? "Tú" : sender.name} ·{" "}
                        {new Intl.DateTimeFormat("es-CO", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(message.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border bg-card p-4 sm:px-6">
          {meetOpen && (
            <div className="mb-3 flex flex-col gap-2 rounded-xl bg-brand-softer p-3 sm:flex-row">
              <Input
                value={meetUrl}
                onChange={(event) => setMeetUrl(event.target.value)}
                placeholder="https://meet.google.com/..."
                aria-label="Enlace de Google Meet"
                type="url"
                disabled={busy}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={busy || !meetUrl.trim()}
                onClick={shareMeet}
              >
                Compartir enlace
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="mb-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(body);
                }
              }}
              rows={2}
              maxLength={4000}
              disabled={busy}
              placeholder={`Escribe a ${other.name}…`}
              aria-label="Mensaje"
              className="min-h-12 resize-none"
            />
            <Button
              type="button"
              size="icon"
              className="size-11 shrink-0"
              disabled={busy || !body.trim()}
              onClick={() => void send(body)}
              aria-label={busy ? "Enviando mensaje" : "Enviar mensaje"}
            >
              <Send className="size-5" aria-hidden />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => setMeetOpen((value) => !value)}
            >
              <Video className="size-4" aria-hidden /> Google Meet
            </Button>
            <p className="text-xs text-muted-foreground" role="status">
              {busy ? "Enviando…" : "Enter para enviar · Shift + Enter para otra línea"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
