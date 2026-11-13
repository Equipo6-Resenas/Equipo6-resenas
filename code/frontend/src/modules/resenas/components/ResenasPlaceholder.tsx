"use client";

// ============================================================================
// modules/resenas/components/ResenasPlaceholder.tsx
// ----------------------------------------------------------------------------
// Grupo 6 — Reseñas de un evento (HU1: calificar y comentar, HU4: respuesta
// pública del organizador).
//
// Se conserva el nombre y el export por defecto para no romper los imports que
// ya existen en:
//   - app/catalogo/[eventoId]/page.tsx          (detalle del evento, Grupo 2)
//   - app/catalogo/[eventoId]/resenas/page.tsx  (ruta propia, Grupo 6)
// Si se quiere renombrar a "Resenas", hay que coordinarlo con el Grupo 2.
// ============================================================================

import { useState } from "react";
import { getMockEvent, SIMULATED_USERS } from "../mockData";
import type { EventStatus } from "../types";
import ResenasSimulacion from "./ResenasSimulacion";
import { ReviewsSection } from "./ReviewsSection";

const SIMULAR = process.env.NEXT_PUBLIC_RESENAS_SIMULAR !== "false";

export default function ResenasPlaceholder({ eventoId }: { eventoId: string }) {
  const [userKey, setUserKey] = useState(SIMULATED_USERS[0].key);
  const [status, setStatus] = useState<EventStatus>("finalizado");

  // TODO: el usuario real vendrá del módulo Auth y el evento, de Catálogo.
  const currentUser = SIMULAR
    ? (SIMULATED_USERS.find((u) => u.key === userKey)?.user ?? null)
    : null;
  const event = { ...getMockEvent(eventoId), status };

  return (
    <div>
      {SIMULAR && (
        <ResenasSimulacion
          userKey={userKey}
          onUserChange={setUserKey}
          status={status}
          onStatusChange={setStatus}
        />
      )}
      <ReviewsSection event={event} currentUser={currentUser} />
    </div>
  );
}
