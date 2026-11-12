import { describe, expect, it } from "vitest";
import { hasAvailableDay, normalizeAvailability, normalizeStateAvailability } from "./availability";
import { applyAction } from "./engine";
import { createSeed } from "./seed";
import type { Availability, DemoState } from "./types";

const schedule: Availability = [
  { day: 1, from: "14:00", to: "16:00" },
  { day: 2, from: "08:00", to: "10:00" },
  { day: 3, from: "14:00", to: "16:00" },
];
function save(state: DemoState, availability: Availability) {
  const result = applyAction(state, { type: "updateProfile", userId: "laura", teaches: [], learns: [], availability });
  if (!result.ok) throw new Error(result.error);
  return result.state;
}
describe("per-day availability", () => {
  it("copies the old shared hours to each selected day", () => {
    expect(normalizeAvailability({ days: [1, 3], from: "14:00", to: "16:00" })).toEqual([schedule[0], schedule[2]]);
  });
  it("normalizes existing aggregate profiles on reads without changing the ledger", () => {
    const state = createSeed();
    const legacy = JSON.parse(JSON.stringify(state));
    legacy.profiles["laura"].availability = { days: [1, 3], from: "14:00", to: "16:00" };
    const normalized = normalizeStateAvailability(legacy);
    expect(normalized.profiles["laura"]?.availability).toEqual([schedule[0], schedule[2]]);
    expect(normalized.movements).toEqual(state.movements);
  });
  it("saves all three schedules and preserves them after a storage round trip", () => {
    const reloaded = normalizeStateAvailability(JSON.parse(JSON.stringify(save(createSeed(), schedule))));
    expect(reloaded.profiles["laura"]?.availability).toEqual(schedule);
  });
  it("changing Tuesday to 9–11 leaves Monday and Wednesday at 14–16", () => {
    const state = save(createSeed(), schedule);
    const updated = save(state, schedule.map((s) => s.day === 2 ? { ...s, from: "09:00", to: "11:00" } : s));
    expect(updated.profiles["laura"]?.availability).toEqual([schedule[0], { day: 2, from: "09:00", to: "11:00" }, schedule[2]]);
    expect(state.profiles["laura"]?.availability).toEqual(schedule);
  });
  it("removing Tuesday excludes it from availability and day filtering", () => {
    const slots = save(createSeed(), schedule.filter((s) => s.day !== 2)).profiles["laura"]?.availability ?? [];
    expect(slots).toEqual([schedule[0], schedule[2]]);
    expect(hasAvailableDay(slots, 2)).toBe(false);
    expect(hasAvailableDay(slots, 1)).toBe(true);
  });
  it("allows saving no active days", () => {
    expect(save(createSeed(), []).profiles["laura"]?.availability).toEqual([]);
  });
  it.each(["from", "to"] as const)("rejects a missing %s and identifies Tuesday", (field) => {
    const result = applyAction(createSeed(), { type: "updateProfile", userId: "laura", teaches: [], learns: [], availability: schedule.map((s) => s.day === 2 ? { ...s, [field]: "" } : s) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Martes:/);
  });
  it.each(["08:00", "07:00"])("rejects a Tuesday end at %s when start is 08:00", (to) => {
    const result = applyAction(createSeed(), { type: "updateProfile", userId: "laura", teaches: [], learns: [], availability: schedule.map((s) => s.day === 2 ? { ...s, to } : s) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Martes:/);
  });
  it("saves rows in Monday-first order including Sunday last", () => {
    const state = save(createSeed(), [{ day: 0, from: "08:00", to: "10:00" }, ...schedule.slice().reverse()]);
    expect(state.profiles["laura"]?.availability.map((s) => s.day)).toEqual([1, 2, 3, 0]);
  });
});