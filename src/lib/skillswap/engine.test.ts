import { describe, expect, it } from "vitest";

import { applyAction, availableOf, balanceOf, reservedOf, type Action } from "./engine";
import { createSeed } from "./seed";
import type { DemoState } from "./types";

function run(state: DemoState, action: Action): DemoState {
  if (action.type === "confirmSession") {
    const session = state.sessions.find((s) => s.id === action.sessionId);
    if (session?.attentionFlow && session.attentionEndedAt === undefined) {
      const started = applyAction(
        state,
        { type: "startAttention", userId: session.mentorId, sessionId: session.id },
        998,
      );
      if (!started.ok) throw new Error(started.error);
      const ended = applyAction(
        started.state,
        { type: "endAttention", userId: session.mentorId, sessionId: session.id },
        999,
      );
      if (!ended.ok) throw new Error(ended.error);
      state = ended.state;
    }
  }
  const res = applyAction(state, action, 1_000);
  if (!res.ok) throw new Error(res.error);
  return res.state;
}

function publishEmmanuelCss(state: DemoState) {
  const next = run(state, {
    type: "publishRescue",
    userId: "emmanuel",
    title: "Mi tarjeta no se centra con Flexbox",
    description: "Necesito ayuda revisando mi CSS.",
    category: "HTML y CSS",
    minutes: 15,
  });
  return { state: next, rescueId: next.rescues[0]!.id };
}

describe("saldos iniciales", () => {
  it("Emmanuel empieza con 30, Laura con 0 y Vanessa con 30", () => {
    const s = createSeed();
    expect(balanceOf(s, "emmanuel")).toBe(30);
    expect(balanceOf(s, "laura")).toBe(0);
    expect(balanceOf(s, "vanessa")).toBe(30);
  });

  it("Emmanuel tiene una duda de CSS lista para publicar", () => {
    expect(createSeed().drafts["emmanuel"]?.category).toBe("HTML y CSS");
  });
});

describe("rescates", () => {
  it("no permite aceptar tu propio rescate", () => {
    const { state, rescueId } = publishEmmanuelCss(createSeed());
    const res = applyAction(state, { type: "acceptRescue", userId: "emmanuel", rescueId });
    expect(res.ok).toBe(false);
  });

  it("al aceptar reserva los minutos de quien pidió ayuda sin transferirlos", () => {
    const { state, rescueId } = publishEmmanuelCss(createSeed());
    const after = run(state, { type: "acceptRescue", userId: "laura", rescueId });
    expect(after.rescues[0]!.status).toBe("accepted");
    expect(balanceOf(after, "emmanuel")).toBe(30);
    expect(reservedOf(after, "emmanuel")).toBe(15);
    expect(availableOf(after, "emmanuel")).toBe(15);
    expect(balanceOf(after, "laura")).toBe(0);
  });

  it("no permite aceptar si quien pide ayuda no tiene saldo disponible", () => {
    let s = run(createSeed(), {
      type: "publishRescue",
      userId: "laura",
      title: "Duda de inglés",
      description: "Quiero practicar una entrevista.",
      category: "Inglés",
      minutes: 15,
    });
    const res = applyAction(s, {
      type: "acceptRescue",
      userId: "vanessa",
      rescueId: s.rescues[0]!.id,
    });
    expect(res.ok).toBe(false);
    s = res.ok ? res.state : s;
    expect(s.rescues[0]!.status).toBe("open");
  });
});

describe("confirmación y transferencia", () => {
  function acceptedRescue() {
    const { state, rescueId } = publishEmmanuelCss(createSeed());
    const s = run(state, { type: "acceptRescue", userId: "laura", rescueId });
    return { state: s, sessionId: s.sessions[0]!.id };
  }

  it("no transfiere con una sola confirmación", () => {
    const { state, sessionId } = acceptedRescue();
    const s = run(state, { type: "confirmSession", userId: "emmanuel", sessionId });
    expect(balanceOf(s, "emmanuel")).toBe(30);
    expect(balanceOf(s, "laura")).toBe(0);
  });

  it("transfiere los minutos de la sesión cuando ambas personas confirman", () => {
    const { state, sessionId } = acceptedRescue();
    let s = run(state, { type: "confirmSession", userId: "emmanuel", sessionId });
    s = run(s, { type: "confirmSession", userId: "laura", sessionId });
    expect(balanceOf(s, "emmanuel")).toBe(15);
    expect(balanceOf(s, "laura")).toBe(15);
    expect(reservedOf(s, "emmanuel")).toBe(0);
    expect(s.rescues[0]!.status).toBe("completed");
    expect(s.movements.filter((m) => m.sessionId === sessionId)).toHaveLength(1);
  });

  it("confirmar dos veces no duplica la transferencia", () => {
    const { state, sessionId } = acceptedRescue();
    let s = run(state, { type: "confirmSession", userId: "emmanuel", sessionId });
    expect(applyAction(s, { type: "confirmSession", userId: "emmanuel", sessionId }).ok).toBe(
      false,
    );
    s = run(s, { type: "confirmSession", userId: "laura", sessionId });
    expect(applyAction(s, { type: "confirmSession", userId: "laura", sessionId }).ok).toBe(false);
    expect(applyAction(s, { type: "confirmSession", userId: "emmanuel", sessionId }).ok).toBe(
      false,
    );
    expect(s.movements.filter((m) => m.sessionId === sessionId)).toHaveLength(1);
    expect(balanceOf(s, "laura")).toBe(15);
  });

  it("sobrevive a una recarga: el estado guardado no vuelve a transferir", () => {
    const { state, sessionId } = acceptedRescue();
    let s = run(state, { type: "confirmSession", userId: "emmanuel", sessionId });
    s = run(s, { type: "confirmSession", userId: "laura", sessionId });
    const reloaded: DemoState = JSON.parse(JSON.stringify(s));
    expect(applyAction(reloaded, { type: "confirmSession", userId: "laura", sessionId }).ok).toBe(
      false,
    );
    expect(balanceOf(reloaded, "laura")).toBe(15);
  });
});

describe("solicitudes desde Explorar", () => {
  it("una solicitud pendiente no transfiere ni reserva minutos", () => {
    const s = run(createSeed(), {
      type: "requestSession",
      userId: "emmanuel",
      mentorId: "laura",
      topic: "HTML y CSS",
      minutes: 30,
    });
    expect(s.sessions[0]!.status).toBe("pending");
    expect(balanceOf(s, "emmanuel")).toBe(30);
    expect(reservedOf(s, "emmanuel")).toBe(0);
  });

  it("los minutos reservados no se pueden usar en otra sesión", () => {
    let s = run(createSeed(), {
      type: "requestSession",
      userId: "emmanuel",
      mentorId: "laura",
      topic: "HTML y CSS",
      minutes: 30,
    });
    s = run(s, {
      type: "requestSession",
      userId: "emmanuel",
      mentorId: "vanessa",
      topic: "Inglés conversacional",
      minutes: 15,
    });
    const toLaura = s.sessions.find((x) => x.mentorId === "laura")!;
    const toVanessa = s.sessions.find((x) => x.mentorId === "vanessa")!;
    s = run(s, { type: "respondSession", userId: "laura", sessionId: toLaura.id, accept: true });
    expect(availableOf(s, "emmanuel")).toBe(0);
    const res = applyAction(s, {
      type: "respondSession",
      userId: "vanessa",
      sessionId: toVanessa.id,
      accept: true,
    });
    expect(res.ok).toBe(false);
  });

  it("no se puede aceptar la solicitud de alguien sin saldo (Laura con 0 min)", () => {
    const s = run(createSeed(), {
      type: "requestSession",
      userId: "laura",
      mentorId: "vanessa",
      topic: "Inglés conversacional",
      minutes: 15,
    });
    const res = applyAction(s, {
      type: "respondSession",
      userId: "vanessa",
      sessionId: s.sessions[0]!.id,
      accept: true,
    });
    expect(res.ok).toBe(false);
  });
});
