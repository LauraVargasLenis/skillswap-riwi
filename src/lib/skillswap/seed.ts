import type { DemoState } from "./types";

export function createSeed(now: number = Date.now()): DemoState {
  const hour = 60 * 60 * 1000;
  return {
    version: 1,
    testing: true,
    seq: 100,
    activeUserId: "emmanuel",
    profiles: {
      emmanuel: {
        id: "emmanuel",
        name: "Emmanuel",
        tagline: "Coder RIWI · Backend",
        bio: "Disfruto explicar lógica y Python con ejemplos prácticos y mucha paciencia.",
        teaches: [{ id: "sk-1", name: "Python desde cero", category: "Programación", level: "Avanzado" }],
        learns: ["CSS", "Flexbox"],
        availability: [1, 3, 5].map((day) => ({ day, from: "09:00", to: "12:00" })),
      },
      laura: {
        id: "laura",
        name: "Laura",
        tagline: "Coder RIWI · Frontend",
        bio: "Me gusta enseñar desarrollo web, HTML, CSS y diseño adaptable.",
        teaches: [
          { id: "sk-2", name: "HTML y CSS", category: "HTML y CSS", level: "Avanzado" },
          { id: "sk-3", name: "Flexbox y Grid", category: "HTML y CSS", level: "Intermedio" },
        ],
        learns: ["Inglés conversacional"],
        availability: [1, 2, 3, 4, 5].map((day) => ({ day, from: "15:00", to: "18:00" })),
      },
      vanessa: {
        id: "vanessa",
        name: "Juan Daniel",
        tagline: "Coder RIWI · Inglés B2",
        bio: "Podemos practicar inglés conversacional de forma divertida y sencilla.",
        teaches: [{ id: "sk-4", name: "Inglés conversacional", category: "Inglés", level: "Avanzado" }],
        learns: ["Python", "Git"],
        availability: [1, 2, 3, 4, 5, 6].map((day) => ({ day, from: "16:00", to: "19:00" })),
      },
      "juan-manuel": {
        id: "juan-manuel",
        name: "Juan Manuel",
        tagline: "Coder RIWI · Git",
        bio: "Te ayudo a organizar repositorios y trabajar con Git y GitHub.",
        teaches: [{ id: "sk-5", name: "Git y GitHub", category: "Programación", level: "Avanzado" }],
        learns: ["Python"],
        availability: [1, 3, 5].map((day) => ({ day, from: "14:00", to: "17:00" })),
      },
    },
    rescues: [
      {
        id: "res-1",
        authorId: "vanessa",
        title: "Mi primer script de Python no imprime nada",
        description:
          "Escribí una función que suma una lista, pero al ejecutar el archivo no aparece nada en la terminal. Quiero entender qué me falta.",
        category: "Programación",
        minutes: 30,
        status: "open",
        createdAt: now - 2 * hour,
      },
    ],
    sessions: [],
    messages: [],
    notifications: [],
    reviews: [],
    reports: [],
    moderationLog: [],
    restrictions: [],
    onboarding: Object.fromEntries(["emmanuel", "laura", "vanessa", "juan-manuel"].map((id) => [id, { step: 5, completed: true }])),
    presentation: { enabled: false, adminEnabled: false },
    movements: [
      {
        id: "mov-3",
        kind: "earned",
        toId: "juan-manuel",
        minutes: 75,
        concept: "Minutos ganados al enseñar · Saldo inicial de demo",
        at: now - 48 * hour,
      },
      {
        id: "mov-1",
        kind: "welcome",
        toId: "emmanuel",
        minutes: 30,
        concept: "Minutos de bienvenida",
        at: now - 48 * hour,
      },
      {
        id: "mov-2",
        kind: "welcome",
        toId: "vanessa",
        minutes: 30,
        concept: "Minutos de bienvenida",
        at: now - 48 * hour,
      },
    ],
    drafts: {
      emmanuel: {
        title: "Mi tarjeta no se centra con Flexbox",
        description:
          "Tengo un contenedor con display: flex, pero la tarjeta sigue pegada a la izquierda. Ya probé justify-content y no cambia nada. Necesito que alguien revise mi CSS conmigo.",
        category: "HTML y CSS",
        minutes: 15,
      },
    },
  };
}
