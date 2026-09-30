import type { CurrentUser, Review, ReviewEvent } from "./types";

/**
 * DATOS SIMULADOS. Cuando exista backend, reemplazar por llamadas a la API:
 *  - el evento viene del Catálogo de eventos
 *  - el check-in viene del módulo Check-in
 *  - las reseñas vienen de la API de reseñas
 */

export const MOCK_EVENT: ReviewEvent = {
  id: "expo-uv-2026",
  name: "Expo UV 2026 Valparaíso",
  status: "finalizado",
  organizerId: "org-1",
  imageSrc: "/eventos/expo-uv-2026.png",
};

export interface SimulatedUser {
  key: string;
  label: string;
  user: CurrentUser | null;
}

/** Usuarios para probar los distintos casos desde el selector temporal. */
export const SIMULATED_USERS: SimulatedUser[] = [
  { key: "attendee", label: "Asistente con check-in", user: { id: "u-valentina", name: "Valentina Rojas" } },
  { key: "no-check-in", label: "Asistente sin check-in", user: { id: "u-pedro", name: "Pedro Muñoz" } },
  { key: "reviewed", label: "Asistente que ya reseñó", user: { id: "u-maria", name: "María González" } },
  { key: "organizer", label: "Organizador del evento", user: { id: "org-1", name: "Organización Expo UV" } },
  { key: "guest", label: "Visitante (sin sesión)", user: null },
];

const CHECKED_IN_USER_IDS = new Set([
  "u-valentina",
  "u-maria",
  "u-carlos",
  "u-ana",
  "u-javiera",
  "u-diego",
  "u-camila",
]);

export function hasCheckIn(userId: string): boolean {
  return CHECKED_IN_USER_IDS.has(userId);
}

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();

export function createMockReviews(eventId: string): Review[] {
  return [
    {
      id: "r-1",
      eventId,
      userId: "u-maria",
      userName: "María González",
      rating: 5,
      comment:
        "¡Increíble evento! La organización fue impecable y el ambiente espectacular. Sin duda volvería a asistir.",
      createdAt: ago(2),
    },
    {
      id: "r-2",
      eventId,
      userId: "u-carlos",
      userName: "Carlos Rodríguez",
      rating: 4,
      comment:
        "Muy buen evento en general. La música estuvo genial aunque la fila para entrar fue un poco larga.",
      createdAt: ago(7),
      reply: {
        id: "rp-1",
        authorName: "Organización Expo UV",
        text: "¡Gracias por tu comentario, Carlos! Vamos a reforzar los accesos para la próxima edición.",
        createdAt: ago(6),
      },
    },
    {
      id: "r-3",
      eventId,
      userId: "u-ana",
      userName: "Ana Martínez",
      rating: 3,
      comment:
        "El evento estuvo bien, pero esperaba un poco más. El sonido podría mejorar en algunas áreas.",
      createdAt: ago(14),
    },
    {
      id: "r-4",
      eventId,
      userId: "u-javiera",
      userName: "Javiera Soto",
      rating: 5,
      createdAt: ago(21),
    },
    {
      id: "r-5",
      eventId,
      userId: "u-diego",
      userName: "Diego Fuentes",
      rating: 4,
      comment: "Buena organización y buen ambiente. Los stands estaban muy bien distribuidos.",
      createdAt: ago(35),
    },
    {
      id: "r-6",
      eventId,
      userId: "u-camila",
      userName: "Camila Reyes",
      rating: 5,
      comment: "Lo pasé increíble, ya quiero que llegue la siguiente edición.",
      createdAt: ago(40),
    },
  ];
}
