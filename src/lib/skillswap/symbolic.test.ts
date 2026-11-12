import { describe, expect, it } from "vitest";
import { applyAction, availableOf, earnedAvailableOf, reservedOf, type Action } from "./engine";
import { createSeed } from "./seed";
import { migrateDemo } from "./migrate-demo";
import { dispatchSaved } from "./store";
import type { DemoState } from "./types";

function run(s: DemoState, a: Action) { const r = applyAction(s, a, 1000); if (!r.ok) throw new Error(r.error); return r.state; }
const reload = (s: DemoState): DemoState => migrateDemo(JSON.parse(JSON.stringify(s)));
function accept(s: DemoState, userId: string, minutes: number) {
  s = run(s, { type: "requestSession", userId, mentorId: "laura", topic: "HTML y CSS", minutes });
  const session = s.sessions[0]; if (!session) throw new Error("Missing session");
  return { s: run(s, { type: "respondSession", userId: "laura", sessionId: session.id, accept: true }), id: session.id };
}
describe("symbolic demo acceptance rules", () => {
  it("credits Juan Daniel 30 for 9000 COP once, persists 60 and leaves other profiles untouched", () => {
    const initial = createSeed();
    const action: Action = { type: "testTopup", userId: "vanessa", minutes: 30, id: "topup-jd" };
    const s = run(reload(run(initial, action)), action);
    expect(availableOf(s, "vanessa")).toBe(60);
    expect(s.movements.filter((m) => m.topupId === "topup-jd").map((m) => [m.minutes, m.priceCop])).toEqual([[30, 9000]]);
    for (const id of ["laura", "emmanuel", "juan-manuel"]) expect(availableOf(s, id)).toBe(availableOf(initial, id));
  });
  it("withdraws 60 from Juan Manuel's 75 earned for 16000 COP once leaving 15", () => {
    const initial = createSeed(); expect(earnedAvailableOf(initial, "juan-manuel")).toBe(75);
    const action: Action = { type: "testWithdraw", userId: "juan-manuel", blocks: 1, id: "withdraw-jm" };
    const s = run(reload(run(initial, action)), action);
    expect(availableOf(s, "juan-manuel")).toBe(15);
    expect(earnedAvailableOf(s, "juan-manuel")).toBe(15);
    expect(s.movements.filter((m) => m.withdrawalId === "withdraw-jm").map((m) => [m.minutes, m.priceCop])).toEqual([[60, 16000]]);
  });
  it("lets 60 symbolic minutes buy help but grants zero withdrawal availability", () => {
    let s = run(createSeed(), { type: "testTopup", userId: "laura", minutes: 60, id: "only-topup" });
    expect(availableOf(s, "laura")).toBe(60);
    expect(earnedAvailableOf(s, "laura")).toBe(0);
    expect(applyAction(s, { type: "testWithdraw", userId: "laura", blocks: 1, id: "invalid" }).ok).toBe(false);
    s = run(s, { type: "requestSession", userId: "laura", mentorId: "vanessa", topic: "Inglés", minutes: 30 });
    const session = s.sessions[0]; if (!session) throw new Error("Missing session");
    s = run(s, { type: "respondSession", userId: "vanessa", sessionId: session.id, accept: true });
    expect(availableOf(s, "laura")).toBe(30);
    expect(s.sessions[0]?.reservedSources).toEqual({ regular: 30, earned: 0 });
  });
  it("75 earned minus 30 reserved leaves 45 for withdrawal; cancellation restores 75", () => {
    const { s, id } = accept(createSeed(), "juan-manuel", 30);
    expect(reservedOf(s, "juan-manuel")).toBe(30);
    expect(earnedAvailableOf(s, "juan-manuel")).toBe(45);
    expect(applyAction(s, { type: "testWithdraw", userId: "juan-manuel", blocks: 1, id: "blocked" }).ok).toBe(false);
    const cancelled = run(reload(s), { type: "cancelSession", userId: "juan-manuel", sessionId: id });
    expect(earnedAvailableOf(cancelled, "juan-manuel")).toBe(75);
    expect(availableOf(run(cancelled, { type: "testWithdraw", userId: "juan-manuel", blocks: 1, id: "allowed" }), "juan-manuel")).toBe(15);
  });
  it("reserves promotional minutes first and credits teacher as earned only on double confirmation", () => {
    let s = run(createSeed(), { type: "testTopup", userId: "juan-manuel", minutes: 15, id: "mixed" });
    const accepted = accept(s, "juan-manuel", 30); s = accepted.s;
    expect(s.sessions[0]?.reservedSources).toEqual({ regular: 15, earned: 15 });
    s = run(s, { type: "confirmSession", userId: "juan-manuel", sessionId: accepted.id });
    expect(earnedAvailableOf(s, "laura")).toBe(0);
    s = run(s, { type: "confirmSession", userId: "laura", sessionId: accepted.id });
    expect(earnedAvailableOf(s, "laura")).toBe(30);
    expect(earnedAvailableOf(s, "juan-manuel")).toBe(60);
    expect(s.movements.find((m) => m.sessionId === accepted.id)?.spentSources).toEqual({ regular: 15, earned: 15 });
  });
  it("keeps mentor, topic and duration after topup without sending", () => {
    let s = run(createSeed(), { type: "testSaveDraft", userId: "laura", mentorId: "vanessa", topic: "Inglés conversacional", minutes: 15, note: "Entrevista" });
    s = reload(run(s, { type: "testTopup", userId: "laura", minutes: 30, id: "draft-topup" }));
    expect(s.requestDrafts?.["laura"]).toEqual({ mentorId: "vanessa", topic: "Inglés conversacional", minutes: 15, note: "Entrevista" });
    expect(s.sessions).toHaveLength(0);
  });
  it("rejects fractional blocks and insufficient earned minutes", () => {
    for (const blocks of [0, 0.5, 2]) expect(applyAction(createSeed(), { type: "testWithdraw", userId: "juan-manuel", blocks, id: "bad" }).ok).toBe(false);
  });
  it("serializes competing demo reservation and withdrawal with fresh saved balances", async () => {
    let s = run(createSeed(), { type: "requestSession", userId: "juan-manuel", mentorId: "laura", topic: "CSS", minutes: 30 });
    const id = s.sessions[0]?.id; if (!id) throw new Error("Missing session");
    window.localStorage.setItem("skillswap-demo-v1", JSON.stringify(s));
    const results = await Promise.all([dispatchSaved({ type: "testWithdraw", userId: "juan-manuel", blocks: 1, id: "race" }), dispatchSaved({ type: "respondSession", userId: "laura", sessionId: id, accept: true })]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    s = JSON.parse(window.localStorage.getItem("skillswap-demo-v1") ?? "null");
    expect(availableOf(s, "juan-manuel")).toBe(15);
  });
});