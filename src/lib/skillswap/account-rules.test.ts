import { profileOf } from "./profile";
import { describe, it, expect } from "vitest";
import { applyAction, availableOf, balanceOf, reservedOf, type Action } from "./engine";
import { createSeed } from "./seed";
import { migrateDemo } from "./migrate-demo";
import type { DemoState } from "./types";
function run(s: DemoState, a: Action) {
  if (a.type === "confirmSession") {
    const session = s.sessions.find((x) => x.id === a.sessionId);
    if (session?.attentionFlow && session.attentionEndedAt === undefined) {
      const started = applyAction(
        s,
        { type: "startAttention", userId: session.mentorId, sessionId: session.id },
        121,
      );
      if (!started.ok) throw new Error(started.error);
      const ended = applyAction(
        started.state,
        { type: "endAttention", userId: session.mentorId, sessionId: session.id },
        122,
      );
      if (!ended.ok) throw new Error(ended.error);
      s = ended.state;
    }
  }
  const r = applyAction(s, a, 123);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
describe("updated account and demo rules", () => {
  it("keeps Juan Daniel's old ledger and gives Juan Manuel 75 earned demo minutes once", () => {
    const s = createSeed();
    profileOf(s, "vanessa").name = "Vanessa";
    const before = s.movements.filter((m) => m.toId === "vanessa");
    const migrated = migrateDemo(migrateDemo(s));
    expect(profileOf(migrated, "vanessa").name).toBe("Juan Daniel");
    expect(migrated.movements.filter((m) => m.toId === "vanessa")).toEqual(before);
    expect(balanceOf(migrated, "juan-manuel")).toBe(75);
    expect(profileOf(migrated, "juan-manuel").teaches[0]?.name).toBe("Git y GitHub");
    expect(Object.keys(migrated.profiles)).toHaveLength(4);
  });
  for (const canceller of ["emmanuel", "laura"])
    it(`${canceller} cancels after one confirmation and releases reservation`, () => {
      let s = run(createSeed(), {
        type: "publishRescue",
        userId: "emmanuel",
        title: "Ayuda CSS",
        description: "Necesito revisar mi CSS",
        category: "HTML y CSS",
        minutes: 15,
      });
      const rescue = s.rescues[0];
      if (!rescue) throw new Error("missing rescue");
      expect(availableOf(s, "emmanuel")).toBe(30);
      s = run(s, { type: "acceptRescue", userId: "laura", rescueId: rescue.id });
      const session = s.sessions[0];
      if (!session) throw new Error("missing session");
      s = run(s, { type: "confirmSession", userId: "laura", sessionId: session.id });
      expect(reservedOf(s, "emmanuel")).toBe(15);
      s = run(s, { type: "cancelSession", userId: canceller, sessionId: session.id });
      expect(reservedOf(s, "emmanuel")).toBe(0);
      expect(availableOf(s, "emmanuel")).toBe(30);
      expect(s.sessions[0]?.status).toBe("cancelled");
      expect(s.rescues[0]?.status).toBe("open");
      s = run(s, { type: "acceptRescue", userId: "laura", rescueId: rescue.id });
      const retry = s.sessions[0];
      if (!retry) throw new Error("missing retry");
      s = run(s, { type: "confirmSession", userId: "laura", sessionId: retry.id });
      s = run(s, { type: "confirmSession", userId: "emmanuel", sessionId: retry.id });
      expect(balanceOf(s, "laura")).toBe(15);
      expect(s.movements.filter((m) => m.kind === "session")).toHaveLength(1);
      expect(
        applyAction(s, { type: "cancelSession", userId: canceller, sessionId: retry.id }).ok,
      ).toBe(false);
    });
  it("outsiders cannot cancel", () => {
    const s = run(createSeed(), { type: "acceptRescue", userId: "laura", rescueId: "res-1" });
    const session = s.sessions[0];
    if (!session) throw new Error("missing session");
    expect(
      applyAction(s, { type: "cancelSession", userId: "emmanuel", sessionId: session.id }).ok,
    ).toBe(false);
  });
});
