import type { DemoState, Profile } from "./types";
export function profileOf(state: DemoState, id: string): Profile {
  const profile = state.profiles[id];
  if (!profile) throw new Error("Ese perfil no existe.");
  return profile;
}