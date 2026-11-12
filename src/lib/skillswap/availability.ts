import type { Availability, DemoState } from "./types";

/** Upgrade shared schedules at storage boundaries, without losing selected days. */
export function normalizeAvailability(value: unknown): Availability {
  if (Array.isArray(value)) return value.map((slot) => ({ day: slot.day, from: slot.from, to: slot.to }));
  if (value && typeof value === "object" && "days" in value && Array.isArray(value.days) && "from" in value && "to" in value) {
    const { from, to } = value;
    if (typeof from === "string" && typeof to === "string") return value.days.map((day) => ({ day, from, to }));
  }
  return [];
}

export function normalizeStateAvailability(state: DemoState): DemoState {
  return { ...state, profiles: Object.fromEntries(Object.entries(state.profiles).map(([id, profile]) => [id, { ...profile, availability: normalizeAvailability(profile.availability) }])) };
}

export function hasAvailableDay(availability: Availability, day: number): boolean {
  return availability.some((slot) => slot.day === day);
}