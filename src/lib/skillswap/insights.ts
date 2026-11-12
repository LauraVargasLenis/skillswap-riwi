import type { DemoState, Profile, UserId, Review, Rescue } from "./types";

/** All statistics are recomputed from completed sessions, never stored as editable counters. */
export function impactOf(state: DemoState, userId: UserId) {
  const completed = state.sessions.filter((s) => s.status === "completed" && (s.mentorId === userId || s.learnerId === userId));
  const taught = completed.filter((s) => s.mentorId === userId);
  const learned = completed.filter((s) => s.learnerId === userId);
  const reviews = (state.reviews ?? []).filter((r) => r.targetId === userId);
  const badges = [
    ...(completed.length >= 1 ? ["Primer intercambio"] : []),
    ...(taught.length >= 1 ? ["Primera ayuda"] : []),
    ...(completed.length >= 5 ? ["Cinco intercambios"] : []),
  ];
  return {
    taught: taught.reduce((sum, s) => sum + s.minutes, 0),
    learned: learned.reduce((sum, s) => sum + s.minutes, 0),
    completed: completed.length,
    helped: new Set(taught.map((s) => s.learnerId)).size,
    average: reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null,
    reviewCount: reviews.length,
    badges,
  };
}

export function ratingsFor(reviews: Review[], id: string) {
  const mine = reviews.filter((r) => r.targetId === id);
  return { count: mine.length, average: mine.length ? mine.reduce((s, r) => s + r.rating, 0) / mine.length : null };
}

const normalized = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const STOP = new Set(["y", "de", "para", "desde", "a", "el", "la", "en", "basico", "basica", "conversacional", "mejorar", "aprender"]);
function tokens(s: string) { return normalized(s).split(/[^a-z0-9+#]+/).filter((word) => word.length > 1 && !STOP.has(word)); }
function matchSkill(learn: string, skill: string): boolean {
  const desired = tokens(learn), offered = tokens(skill);
  return desired.some((word) => offered.includes(word)) || (desired.includes("programacion") && offered.includes("python"));
}
function overlaps(a: Profile, b: Profile) {
  return a.availability.some((first) => b.availability.some((second) => first.day === second.day && first.from < second.to && second.from < first.to));
}

export function recommendationsFor(state: DemoState, id: UserId) {
  const me = state.profiles[id];
  if (!me) return [];
  return Object.values(state.profiles).filter((p) => p.id !== id).map((person) => {
    const skills = person.teaches.filter((skill) => me.learns.some((l) => matchSkill(l, skill.name)));
    const reciprocal = me.teaches.some((skill) => person.learns.some((l) => matchSkill(l, skill.name)));
    const compatible = overlaps(me, person);
    const rating = ratingsFor(state.reviews ?? [], person.id);
    const levelPoints = skills.reduce((max, sk) => Math.max(max, sk.level === "Avanzado" ? 3 : sk.level === "Intermedio" ? 2 : 1), 0);
    const score = skills.length * 40 + (reciprocal ? 30 : 0) + (compatible ? 15 : 0) + levelPoints * 3 + (rating.average ?? 0) * 2;
    const reasons = [skills.length ? `Enseña ${skills.map((s) => s.name).join(", ")}` : "", reciprocal ? "Intercambio recíproco" : "", compatible ? "Coinciden sus horarios" : "", rating.count ? `${rating.average?.toFixed(1)}★ de ${rating.count} valoraciones` : ""].filter(Boolean);
    return { person, score, skills, reciprocal, compatible, reasons };
  }).filter((r) => r.skills.length > 0).sort((a, b) => b.score - a.score);
}

export function rescueRelevance(state: DemoState, id: UserId, rescue: Rescue) {
  const me = state.profiles[id];
  if (!me || rescue.authorId === id || rescue.status !== "open") return 0;
  const matching = me.teaches.some((s) => s.category === rescue.category || matchSkill(rescue.title + " " + rescue.description, s.name));
  if (!matching) return 0;
  return 50 + (rescue.timing === "immediate" ? 15 : 0) + Math.max(0, 5 - (Date.now() - rescue.createdAt) / 3600000);
}
