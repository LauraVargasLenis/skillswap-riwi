import { describe, expect, it } from "vitest";

import { applyAction, balanceOf, type Action } from "./engine";
import { createSeed } from "./seed";
import type { DemoState, Session } from "./types";

function run(state: DemoState, action: Action, now = 10_000) {
  const result = applyAction(state, action, now);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

function acceptedSession(demo = true): Session & { scheduledAt: number } {
  return {
    id: "session-test",
    learnerId: "emmanuel",
    mentorId: "laura",
    minutes: 15,
    topic: "HTML y CSS",
    origin: "explore",
    status: "accepted",
    learnerConfirmed: false,
    mentorConfirmed: false,
    createdAt: 1_000,
    acceptedAt: 2_000,
    scheduledAt: 50_000,
    reservedSources: { regular: 15, earned: 0 },
    ...(demo ? { demo: true } : {}),
  };
}

describe("private exchange conversations", () => {
  it("persists a message, notifies only the other participant and deduplicates retries", () => {
    let state: DemoState = { ...createSeed(1_000), sessions: [acceptedSession()] };
    const action: Action = {
      type: "sendMessage",
      userId: "emmanuel",
      sessionId: "session-test",
      body: "Te comparto https://meet.google.com/abc-defg-hij",
      clientId: "browser-operation-1",
    };
    state = run(state, action, 8_000);
    const retried = run(state, action, 9_000);
    expect(retried.messages).toHaveLength(1);
    expect(retried.messages?.[0]?.body).toContain("https://meet.google.com/abc-defg-hij");
    expect(retried.notifications?.filter((n) => n.kind === "message")).toHaveLength(1);
    expect(retried.notifications?.[0]?.userId).toBe("laura");
    const reloaded = JSON.parse(JSON.stringify(retried)) as DemoState;
    expect(reloaded.messages?.[0]?.createdAt).toBe(8_000);
  });

  it("rejects a third party even when they know the session id", () => {
    const state = { ...createSeed(1_000), sessions: [acceptedSession()] };
    const result = applyAction(state, {
      type: "sendMessage",
      userId: "vanessa",
      sessionId: "session-test",
      body: "No debería entrar",
      clientId: "outsider-1",
    });
    expect(result.ok).toBe(false);
    expect(state.messages ?? []).toHaveLength(0);
  });
});

describe("persistent notifications", () => {
  it("creates request and acceptance events once and tracks read state per owner", () => {
    let state = run(createSeed(1_000), {
      type: "requestSession",
      userId: "emmanuel",
      mentorId: "laura",
      topic: "HTML y CSS",
      minutes: 15,
    });
    const session = state.sessions[0]!;
    expect(state.notifications?.some((n) => n.kind === "request" && n.userId === "laura")).toBe(
      true,
    );
    state = run(state, {
      type: "respondSession",
      userId: "laura",
      sessionId: session.id,
      accept: true,
    });
    const notification = state.notifications?.find(
      (n) => n.kind === "accepted" && n.userId === "emmanuel",
    );
    expect(notification).toBeDefined();
    const rejectedRead = applyAction(state, {
      type: "markNotificationRead",
      userId: "laura",
      notificationId: notification!.id,
    });
    expect(rejectedRead.ok).toBe(false);
    state = run(state, {
      type: "markNotificationRead",
      userId: "emmanuel",
      notificationId: notification!.id,
    });
    expect(state.notifications?.find((n) => n.id === notification!.id)?.readAt).toBe(10_000);
    expect(state.notifications?.filter((n) => n.eventKey === notification!.eventKey)).toHaveLength(
      1,
    );
  });

  it("creates upcoming reminders within sixty minutes without duplicating them", () => {
    const session = { ...acceptedSession(), scheduledAt: 20_000 };
    let state: DemoState = { ...createSeed(1_000), sessions: [session] };
    state = run(state, { type: "syncNotifications", userId: "emmanuel" }, 5_000);
    expect(state.notifications?.filter((n) => n.kind === "reminder")).toHaveLength(2);
    state = run(state, { type: "syncNotifications", userId: "emmanuel" }, 6_000);
    expect(state.notifications?.filter((n) => n.kind === "reminder")).toHaveLength(2);
  });
});

describe("authorized early demo completion rules", () => {
  it("allows confirmations before the scheduled end only in an audited demo and transfers once", () => {
    let state: DemoState = { ...createSeed(1_000), sessions: [acceptedSession()] };
    state = run(
      state,
      {
        type: "adminFinishDemo",
        userId: "verified-admin-uuid",
        sessionId: "session-test",
        auditId: "123e4567-e89b-42d3-a456-426614174000",
      },
      9_000,
    );
    expect(state.sessions[0]?.earlyDemo?.byUserId).toBe("verified-admin-uuid");
    state = run(
      state,
      { type: "confirmSession", userId: "emmanuel", sessionId: "session-test" },
      9_100,
    );
    state = run(
      state,
      { type: "confirmSession", userId: "laura", sessionId: "session-test" },
      9_200,
    );
    expect(balanceOf(state, "emmanuel")).toBe(15);
    expect(balanceOf(state, "laura")).toBe(15);
    expect(state.movements.filter((m) => m.sessionId === "session-test")).toHaveLength(1);
    expect(state.notifications?.filter((n) => n.kind === "completed")).toHaveLength(2);
    expect(state.notifications?.filter((n) => n.kind === "balance")).toHaveLength(2);
    expect(state.messages ?? []).toHaveLength(0);
  });

  it("rejects early completion in a real ledger or a session not marked demo", () => {
    const realState = {
      ...createSeed(1_000),
      testing: false,
      sessions: [acceptedSession(false)],
    };
    const result = applyAction(
      realState,
      {
        type: "adminFinishDemo",
        userId: "verified-admin-uuid",
        sessionId: "session-test",
        auditId: "123e4567-e89b-42d3-a456-426614174000",
      },
      9_000,
    );
    expect(result.ok).toBe(false);
    expect(realState.sessions[0]?.earlyDemo).toBeUndefined();
    expect(realState.movements.filter((m) => m.sessionId === "session-test")).toHaveLength(0);
  });

  it("cannot register the same early demo finish with a second audit", () => {
    let state: DemoState = { ...createSeed(1_000), sessions: [acceptedSession()] };
    state = run(state, {
      type: "adminFinishDemo",
      userId: "verified-admin-uuid",
      sessionId: "session-test",
      auditId: "123e4567-e89b-42d3-a456-426614174000",
    });
    const result = applyAction(state, {
      type: "adminFinishDemo",
      userId: "verified-admin-uuid",
      sessionId: "session-test",
      auditId: "223e4567-e89b-42d3-a456-426614174000",
    });
    expect(result.ok).toBe(false);
    expect(state.sessions[0]?.earlyDemo?.auditId).toBe("123e4567-e89b-42d3-a456-426614174000");
  });
});
