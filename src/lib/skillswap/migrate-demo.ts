import { createSeed } from "./seed";
import { USER_IDS, type DemoState } from "./types";
import { profileOf } from "./profile";
import { normalizeStateAvailability } from "./availability";

export function migrateDemo(state: DemoState): DemoState {
  const seed = createSeed();
  return normalizeStateAvailability({
    ...state,
    testing: true,
    sessions: state.sessions.map((session) => ({ ...session, demo: true })),
    messages: state.messages ?? [],
    notifications: state.notifications ?? [],
    reviews: state.reviews ?? [],
    reports: state.reports ?? [],
    moderationLog: state.moderationLog ?? [],
    restrictions: state.restrictions ?? [],
    onboarding: state.onboarding ?? seed.onboarding ?? {},
    presentation: state.presentation ?? seed.presentation ?? { enabled: false },
    profiles: Object.fromEntries(USER_IDS.map((id) => {
      const baseline = profileOf(seed, id);
      const current = state.profiles[id] ?? baseline;
      return [id, {
        ...baseline,
        ...current,
        name: id === "vanessa" ? "Juan Daniel" : current.name,
        bio: current.bio ?? baseline.bio ?? "",
        teaches: current.teaches.map((skill) => ({
          ...skill,
          level: skill.level ?? baseline.teaches.find((candidate) => candidate.id === skill.id)?.level ?? "Inicial",
        })),
      }];
    })),
    movements: state.movements.some((m) => m.toId === "juan-manuel")
      ? state.movements
      : [...state.movements, ...seed.movements.filter((m) => m.toId === "juan-manuel")],
  });
}
