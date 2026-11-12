import { describe, it, expect } from "vitest";
import {
  applyAction,
  availabilityError,
  balanceOf,
  bookableSlots,
  nextScheduledSession,
  reservedOf,
  schedulingError,
  type Action,
} from "./engine";
import { createSeed } from "./seed";
import { availabilityLines } from "./format";
import { localInstant, localParts } from "./time";
import type { DemoState } from "./types";

const now = Date.UTC(2026, 10, 9, 0);
const start = Date.UTC(2026, 10, 9, 13); // Monday 08:00 Bogota
function setup() {
  const s = createSeed(now);
  const p = s.profiles["laura"];
  if (!p) throw new Error("Missing profile");
  p.availability = [
    { day: 1, from: "08:00", to: "10:00" },
    { day: 1, from: "14:00", to: "16:00" },
    { day: 2, from: "08:00", to: "10:00" },
  ];
  return s;
}
function run(s: DemoState, action: Action, at = now): DemoState {
  const r = applyAction(s, action, at);
  if (!r.ok) throw new Error(r.error);
  return r.state;
}
function request(s: DemoState, userId = "emmanuel", scheduledAt = start) {
  return run(s, {
    type: "requestSession",
    userId,
    mentorId: "laura",
    topic: "HTML y CSS",
    minutes: 15,
    scheduledAt,
    timeZone: "America/Bogota",
  });
}
function firstId(s: DemoState) {
  const id = s.sessions[0]?.id;
  if (!id) throw new Error("Missing session");
  return id;
}
function accepted() {
  const s = request(setup());
  return run(s, { type: "respondSession", userId: "laura", sessionId: firstId(s), accept: true });
}
describe("Scheduling rules", () => {
  it("preserves two Monday bands and Tuesday on a storage round trip", () => {
    const s = setup();
    const p = s.profiles["laura"];
    if (!p) throw new Error("Missing");
    const updated = run(s, {
      type: "updateProfile",
      userId: "laura",
      teaches: p.teaches,
      learns: p.learns,
      availability: p.availability,
      timeZone: "America/Bogota",
      blockedDates: ["2026-11-10"],
    });
    expect(JSON.parse(JSON.stringify(updated)).profiles.laura.availability).toEqual(p.availability);
    expect(availabilityLines(p.availability)).toHaveLength(2);
  });
  it("rejects overlapping Monday bands but accepts adjacent bands", () => {
    expect(
      availabilityError([
        { day: 1, from: "08:00", to: "10:00" },
        { day: 1, from: "09:00", to: "11:00" },
      ]),
    ).not.toBeNull();
    expect(
      availabilityError([
        { day: 1, from: "08:00", to: "10:00" },
        { day: 1, from: "10:00", to: "11:00" },
      ]),
    ).toBeNull();
  });
  it("shows only whole 15 or 30 minute slots in both Monday bands", () => {
    const s = setup();
    expect(bookableSlots(s, "emmanuel", "laura", "2026-11-09", 15, now)).toHaveLength(16);
    expect(bookableSlots(s, "emmanuel", "laura", "2026-11-09", 30, now)).toHaveLength(14);
    expect(schedulingError(s, "emmanuel", "laura", start + 105 * 60000, 30, now)).not.toBeNull();
  });
  it("blocked mentor and learner dates remove all slots", () => {
    const s = setup();
    const p = s.profiles["laura"];
    if (!p) throw new Error("Missing");
    p.blockedDates = ["2026-11-09"];
    expect(bookableSlots(s, "emmanuel", "laura", "2026-11-09", 15, now)).toEqual([]);
    p.blockedDates = [];
    const me = s.profiles["emmanuel"];
    if (!me) throw new Error("Missing");
    me.blockedDates = ["2026-11-09"];
    expect(bookableSlots(s, "emmanuel", "laura", "2026-11-09", 15, now)).toEqual([]);
  });
  it("pending does not reserve, two simultaneous acceptances cannot reserve the same mentor", () => {
    let s = request(request(setup()), "vanessa");
    const second = firstId(s);
    const first = s.sessions[1]?.id;
    if (!first) throw new Error("Missing");
    expect(reservedOf(s, "emmanuel")).toBe(0);
    s = run(s, { type: "respondSession", userId: "laura", sessionId: first, accept: true });
    expect(
      applyAction(
        s,
        { type: "respondSession", userId: "laura", sessionId: second, accept: true },
        now,
      ).ok,
    ).toBe(false);
    expect(reservedOf(s, "emmanuel")).toBe(15);
  });
  it("anonymous occupied intervals prevent conflicts without exposing sessions", () => {
    const s = setup();
    s.busySlots = { laura: [{ start, end: start + 15 * 60000 }] };
    expect(bookableSlots(s, "emmanuel", "laura", "2026-11-09", 15, now)).not.toContain(start);
  });
  it("cancel releases both time and minutes", () => {
    let s = accepted();
    expect(bookableSlots(s, "vanessa", "laura", "2026-11-09", 15, now)).not.toContain(start);
    s = run(s, { type: "cancelSession", userId: "emmanuel", sessionId: firstId(s) });
    expect(reservedOf(s, "emmanuel")).toBe(0);
    expect(bookableSlots(s, "vanessa", "laura", "2026-11-09", 15, now)).toContain(start);
  });
  it("rejects early confirmation and transfers once after the scheduled 15 minutes", () => {
    let s = accepted();
    const id = firstId(s);
    expect(
      applyAction(
        s,
        { type: "confirmSession", userId: "emmanuel", sessionId: id },
        start + 14 * 60000,
      ).ok,
    ).toBe(false);
    s = run(s, { type: "confirmSession", userId: "emmanuel", sessionId: id }, start + 15 * 60000);
    expect(balanceOf(s, "emmanuel")).toBe(30);
    s = run(s, { type: "confirmSession", userId: "laura", sessionId: id }, start + 15 * 60000);
    expect(balanceOf(s, "emmanuel")).toBe(15);
    expect(s.movements.filter((m) => m.sessionId === id)).toHaveLength(1);
    expect(
      applyAction(s, { type: "confirmSession", userId: "laura", sessionId: id }, start + 16 * 60000)
        .ok,
    ).toBe(false);
  });
  it("reprogramming requires the other participant and preserves original until acceptance", () => {
    let s = accepted();
    const id = firstId(s),
      next = start + 6 * 3600000;
    s = run(s, {
      type: "proposeReschedule",
      userId: "emmanuel",
      sessionId: id,
      scheduledAt: next,
      timeZone: "America/Bogota",
    });
    expect(s.sessions[0]?.scheduledAt).toBe(start);
    expect(
      applyAction(
        s,
        { type: "respondReschedule", userId: "emmanuel", sessionId: id, accept: true },
        now,
      ).ok,
    ).toBe(false);
    s = run(s, { type: "respondReschedule", userId: "laura", sessionId: id, accept: true });
    expect(s.sessions[0]?.scheduledAt).toBe(next);
    expect(s.sessions[0]?.scheduleHistory?.[0]?.scheduledAt).toBe(start);
    expect(reservedOf(s, "emmanuel")).toBe(15);
  });
  it("rejecting a reprogramming keeps the original reservation", () => {
    let s = accepted();
    const id = firstId(s);
    s = run(s, {
      type: "proposeReschedule",
      userId: "emmanuel",
      sessionId: id,
      scheduledAt: start + 6 * 3600000,
      timeZone: "America/Bogota",
    });
    s = run(s, { type: "respondReschedule", userId: "laura", sessionId: id, accept: false });
    expect(s.sessions[0]?.scheduledAt).toBe(start);
    expect(s.sessions[0]?.reschedule).toBeUndefined();
  });
  it("revalidates conflicts at reprogram acceptance", () => {
    let s = accepted();
    const id = firstId(s),
      next = start + 6 * 3600000;
    s = run(s, {
      type: "proposeReschedule",
      userId: "emmanuel",
      sessionId: id,
      scheduledAt: next,
      timeZone: "America/Bogota",
    });
    s = request(s, "vanessa", next);
    s = run(s, { type: "respondSession", userId: "laura", sessionId: firstId(s), accept: true });
    expect(
      applyAction(
        s,
        { type: "respondReschedule", userId: "laura", sessionId: id, accept: true },
        now,
      ).ok,
    ).toBe(false);
    expect(s.sessions.find((x) => x.id === id)?.scheduledAt).toBe(start);
  });
  it("profile edits cannot remove an accepted reservation's band", () => {
    const s = accepted();
    const p = s.profiles["laura"];
    if (!p) throw new Error("Missing");
    expect(
      applyAction(
        s,
        {
          type: "updateProfile",
          userId: "laura",
          teaches: p.teaches,
          learns: p.learns,
          availability: [],
        },
        now,
      ).ok,
    ).toBe(false);
  });
  it("selects next by start time, not creation order, and ignores legacy sessions", () => {
    const s = accepted();
    const session = s.sessions[0];
    if (!session) throw new Error("Missing");
    s.sessions = [
      { ...session, id: "late", scheduledAt: start + 3600000 },
      { ...session, id: "legacy", scheduledAt: undefined },
      session,
    ];
    expect(nextScheduledSession(s, "emmanuel", now)?.id).toBe(session.id);
  });
  it("new immediate rescues require recorded start and end by mentor", () => {
    let s = run(createSeed(now), {
      type: "publishRescue",
      userId: "emmanuel",
      title: "Ayuda CSS",
      description: "Necesito revisar CSS",
      category: "HTML y CSS",
      minutes: 15,
    });
    const rescueId = s.rescues[0]?.id;
    if (!rescueId) throw new Error("Missing");
    s = run(s, { type: "acceptRescue", userId: "laura", rescueId });
    const id = firstId(s);
    expect(
      applyAction(s, { type: "confirmSession", userId: "emmanuel", sessionId: id }, now).ok,
    ).toBe(false);
    expect(
      applyAction(s, { type: "startAttention", userId: "emmanuel", sessionId: id }, now).ok,
    ).toBe(false);
    s = run(s, { type: "startAttention", userId: "laura", sessionId: id }, now);
    s = run(s, { type: "endAttention", userId: "laura", sessionId: id }, now + 60000);
    s = run(s, { type: "confirmSession", userId: "emmanuel", sessionId: id }, now + 60000);
    s = run(s, { type: "confirmSession", userId: "laura", sessionId: id }, now + 60000);
    expect(balanceOf(s, "laura")).toBe(15);
  });
  it("Bogota starts at UTC-5 and rejects ambiguous DST times", () => {
    expect(localInstant("2026-11-09", "08:00", "America/Bogota")).toBe(start);
    expect(localParts(start, "America/Bogota").time).toBe("08:00");
    expect(localInstant("2026-11-01", "01:30", "America/New_York")).toBeNull();
  });
});
