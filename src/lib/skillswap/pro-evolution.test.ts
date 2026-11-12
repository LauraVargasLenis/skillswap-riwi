import { describe, it, expect } from "vitest";
import { applyAction, balanceOf, reservedOf } from "./engine";
import { createSeed } from "./seed";
import { recommendationsFor, impactOf, rescueRelevance } from "./insights";
import type { Action, Result } from "./engine";
import type { DemoState, DemoScenario } from "./types";

const now = Date.UTC(2026, 10, 10, 21, 0);
function run(state: DemoState, action: Action) {
  const result = applyAction(state, action, now);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}
function prepare(scenario: DemoScenario) {
  let state = run(createSeed(now), { type: "setPresentation", enabled: true });
  return run(state, { type: "prepareScenario", scenario });
}
function denied(result: Result) { expect(result.ok).toBe(false); }

describe("SkillSwap PRO — demo isolated, production-safe rules", () => {
  it("prepares all eight demos and resets only tagged objects", () => {
    for (const scenario of ["agenda", "chat", "reputation", "onboarding", "matching", "impact", "moderation", "rescues"] as DemoScenario[]) {
      let state = prepare(scenario);
      expect(state.presentation?.scenario).toBe(scenario);
      state = run(state, { type: "resetScenario", scenario });
      expect(state.sessions.some((s) => s.scenarioId === scenario)).toBe(false);
      expect(state.rescues.some((r) => r.scenarioId === scenario)).toBe(false);
      expect(state.reviews?.some((r) => r.scenarioId === scenario)).toBe(false);
      expect(state.movements.some((r) => r.scenarioId === scenario)).toBe(false);
    }
  });
  it("does not discard another scenario when resetting chat", () => {
    let state = prepare("chat");
    state = run(state, { type: "prepareScenario", scenario: "rescues" });
    expect(state.sessions.some((s) => s.scenarioId === "chat")).toBe(true);
    state = run(state, { type: "resetScenario", scenario: "chat" });
    expect(state.rescues.filter((r) => r.scenarioId === "rescues")).toHaveLength(4);
    expect(state.sessions.some((s) => s.scenarioId === "chat")).toBe(false);
  });
  it("requires simulated administrator; close, confirmations and transfer are separate", () => {
    let state = prepare("chat");
    const id = state.sessions[0]!.id;
    state = run(state, { type: "switchUser", userId: "emmanuel" });
    state = run(state, { type: "respondSession", userId: "emmanuel", sessionId: id, accept: true });
    denied(applyAction(state, { type: "demoFinishLocally", userId: "emmanuel", sessionId: id }, now));
    state = run(state, { type: "setDemoAdmin", enabled: true });
    state = run(state, { type: "demoFinishLocally", userId: "emmanuel", sessionId: id });
    expect(state.sessions[0]?.status).toBe("accepted");
    expect(reservedOf(state, "laura")).toBe(15);
    state = run(state, { type: "confirmSession", userId: "emmanuel", sessionId: id });
    expect(state.movements.some((m) => m.sessionId === id)).toBe(false);
    state = run(state, { type: "confirmSession", userId: "laura", sessionId: id });
    expect(state.movements.filter((m) => m.sessionId === id)).toHaveLength(1);
    expect(balanceOf(state, "emmanuel")).toBe(45);
    denied(applyAction(state, { type: "confirmSession", userId: "laura", sessionId: id }, now));
    denied(applyAction(state, { type: "demoFinishLocally", userId: "emmanuel", sessionId: id }, now));
  });
  it("protects conversations and creates per-user notifications", () => {
    let state = prepare("chat");
    const id = state.sessions[0]!.id;
    denied(applyAction(state, { type: "sendMessage", userId: "juan-manuel", sessionId: id, body: "Hola", clientId: "hello" }, now));
    state = run(state, { type: "sendMessage", userId: "laura", sessionId: id, body: "Hola Emmanuel", clientId: "hello" });
    expect(state.notifications?.filter((n) => n.kind === "message" && n.userId === "emmanuel")).toHaveLength(1);
    state = run(state, { type: "sendMessage", userId: "laura", sessionId: id, body: "Hola Emmanuel", clientId: "hello" });
    expect(state.messages?.filter((m) => m.sessionId === id)).toHaveLength(1);
  });
  it("only reviews completed own exchanges once", () => {
    let state = prepare("reputation");
    const completed = state.sessions[0]!;
    expect(completed.status).toBe("completed");
    expect(state.reviews?.filter((r) => r.sessionId === completed.id)).toHaveLength(1);
    denied(applyAction(state, { type: "submitReview", userId: "vanessa", sessionId: completed.id, rating: 4, comment: "Excelente tutor" }, now));
    denied(applyAction(state, { type: "submitReview", userId: "juan-manuel", sessionId: completed.id, rating: 4, comment: "Excelente tutor" }, now));
    state = run(state, { type: "submitReview", userId: "laura", sessionId: completed.id, rating: 5, comment: "Muy atento y explicó todo." });
    expect(state.reviews?.filter((r) => r.sessionId === completed.id)).toHaveLength(2);
  });
  it("derives statistics and badges only from confirmed completed sessions", () => {
    const state = prepare("impact");
    const impact = impactOf(state, "emmanuel");
    expect(impact.completed).toBe(5);
    expect(impact.taught).toBe(75);
    expect(impact.helped).toBe(2);
    expect(impact.badges).toContain("Primera ayuda");
    expect(impact.badges).toContain("Cinco intercambios");
    expect(impact.reviewCount).toBe(5);
  });
  it("stores onboarding and restarts only selected demo profile", () => {
    let state = run(createSeed(now), { type: "switchUser", userId: "juan-manuel" });
    state = run(state, { type: "setPresentation", enabled: true });
    state = run(state, { type: "prepareScenario", scenario: "onboarding" });
    expect(state.onboarding?.["juan-manuel"]?.completed).toBe(false);
    expect(state.onboarding?.["laura"]?.completed).toBe(true);
    state = run(state, { type: "saveOnboarding", userId: "juan-manuel", step: 1, completed: false });
    state = run(state, { type: "resetScenario", scenario: "onboarding" });
    expect(state.onboarding?.["juan-manuel"]?.completed).toBe(true);
  });
  it("recommends language match and relevant rescues per active user", () => {
    const state = createSeed(now);
    expect(recommendationsFor(state, "laura")[0]?.person.id).toBe("vanessa");
    const rescued = prepare("rescues");
    expect(rescued.rescues.filter((r) => r.scenarioId === "rescues")).toHaveLength(4);
    expect(rescued.rescues.some((r) => rescueRelevance(rescued, "vanessa", r) > 0)).toBe(true);
    expect(rescued.notifications?.some((n) => n.kind === "rescue")).toBe(true);
  });
  it("simulated reports require demo moderator, record audit and reset cleanly", () => {
    let state = prepare("moderation");
    const report = state.reports![0]!;
    denied(applyAction(state, { type: "moderateReport", userId: "emmanuel", reportId: report.id, resolution: "Se revisa la situación." }, now));
    state = run(state, { type: "setDemoAdmin", enabled: true });
    state = run(state, { type: "moderateReport", userId: "laura", reportId: report.id, resolution: "Se revisa la situación y queda registrado el incidente." });
    expect(state.reports?.[0]?.status).toBe("resolved");
    expect(state.moderationLog?.length).toBe(1);
    state = run(state, { type: "resetScenario", scenario: "moderation" });
    expect(state.reports?.length).toBe(0);
    expect(state.moderationLog?.length).toBe(0);
  });
  it("demo-only actions are forbidden in normal aggregate", () => {
    const realState = { ...createSeed(now), testing: false };
    denied(applyAction(realState, { type: "setPresentation", enabled: true }, now));
    denied(applyAction(realState, { type: "demoFinishLocally", userId: "emmanuel", sessionId: "test" }, now));
  });
});
