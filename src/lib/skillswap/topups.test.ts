import { describe, it, expect } from "vitest";
import { applyAction, balanceOf, reservedOf, type Action } from "./engine";
import { createSeed } from "./seed";
import { TEST_PACKAGES, REAL_CHARGING_ENABLED } from "./topup-config";
import type { DemoState } from "./types";

function run(s: DemoState, a: Action) { const r = applyAction(s, a, 1000); if (!r.ok) throw new Error(r.error); return r.state; }
const seed = (): DemoState => ({ ...createSeed(), testing: true });
const create = (s: DemoState, id = "approved") => run(s, { type: "testCreateTopup", userId: "laura", minutes: 30, id });
describe("isolated test recargas", () => {
  it("offers configurable 15, 30 and 60 packages with example COP prices", () => {
    expect(TEST_PACKAGES.map((p) => p.minutes)).toEqual([15, 30, 60]);
    const s = run(seed(), { type: "testConfigurePackages", userId: "laura", prices: [6000, 10000, 18000] });
    expect(create(s).topups?.[0]?.priceCop).toBe(10000);
  });
  it("keeps real charging disabled and cannot credit a real aggregate", () => {
    expect(REAL_CHARGING_ENABLED).toBe(false);
    const real = { ...createSeed(), testing: false };
    expect(applyAction(real, { type: "testCreateTopup", userId: "laura", minutes: 30, id: "bad" }).ok).toBe(false);
    expect(balanceOf(real, "laura")).toBe(0);
  });
  it("pending topups leave Laura at zero", () => {
    const s = create(seed());
    expect(s.topups?.[0]?.status).toBe("pending");
    expect(balanceOf(s, "laura")).toBe(0);
  });
  it("rejected topups leave Laura at zero and cannot later be approved", () => {
    let s = create(seed(), "rejected");
    s = run(s, { type: "testResolveTopup", userId: "laura", id: "rejected", approved: false });
    expect(s.topups?.[0]?.status).toBe("rejected");
    s = run(s, { type: "testResolveTopup", userId: "laura", id: "rejected", approved: true });
    expect(balanceOf(s, "laura")).toBe(0);
  });
  it("approved topups credit thirty only once across repeated approval and reload", () => {
    let s = create(seed());
    for (let i = 0; i < 3; i++) s = run(JSON.parse(JSON.stringify(s)), { type: "testResolveTopup", userId: "laura", id: "approved", approved: true });
    expect(balanceOf(s, "laura")).toBe(30);
    expect(s.movements.filter((m) => m.topupId === "approved")).toHaveLength(1);
  });
  it("preserves Juan Daniel, English, duration and note without auto-sending", () => {
    let s = run(seed(), { type: "testSaveDraft", userId: "laura", mentorId: "vanessa", topic: "Inglés conversacional", minutes: 15, note: "Entrevista" });
    s = run(create(s), { type: "testResolveTopup", userId: "laura", id: "approved", approved: true });
    expect(s.requestDrafts?.["laura"]).toEqual({ mentorId: "vanessa", topic: "Inglés conversacional", minutes: 15, note: "Entrevista" });
    expect(s.sessions).toHaveLength(0);
  });
  it("Laura finishes with fifteen, a single +30 topup and a single -15 session after both confirmations", () => {
    let s = create(seed(), "rejected");
    s = run(s, { type: "testResolveTopup", userId: "laura", id: "rejected", approved: false });
    expect(balanceOf(s, "laura")).toBe(0);
    s = run(create(s), { type: "testResolveTopup", userId: "laura", id: "approved", approved: true });
    s = run(s, { type: "requestSession", userId: "laura", mentorId: "vanessa", topic: "Inglés conversacional", minutes: 15 });
    const session = s.sessions[0]; if (!session) throw new Error("missing session");
    s = run(s, { type: "respondSession", userId: "vanessa", sessionId: session.id, accept: true });
    expect(reservedOf(s, "laura")).toBe(15);
    s = run(s, { type: "confirmSession", userId: "vanessa", sessionId: session.id });
    expect(balanceOf(s, "laura")).toBe(30);
    s = run(s, { type: "confirmSession", userId: "laura", sessionId: session.id });
    expect(balanceOf(s, "laura")).toBe(15);
    expect(s.movements.filter((m) => m.kind === "topup" && m.toId === "laura").map((m) => m.minutes)).toEqual([30]);
    expect(s.movements.filter((m) => m.fromId === "laura").map((m) => m.minutes)).toEqual([15]);
    expect(balanceOf(createSeed(), "laura")).toBe(0);
  });
});