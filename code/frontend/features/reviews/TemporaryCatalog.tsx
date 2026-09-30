"use client";

import Image from "next/image";
import { useState } from "react";
import { MOCK_EVENT, SIMULATED_USERS } from "./mockData";
import { ReviewsSection } from "./ReviewsSection";
import type { EventStatus } from "./types";
import styles from "./TemporaryCatalog.module.css";

const STATUS_LABEL: Record<EventStatus, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

/**
 * PÁGINA TEMPORAL: reemplaza al Catálogo de eventos mientras ese módulo no
 * esté integrado. El panel "Simulación" se elimina al conectar sesión y backend.
 */
export function TemporaryCatalog() {
  const [userKey, setUserKey] = useState(SIMULATED_USERS[0].key);
  const [status, setStatus] = useState<EventStatus>("finalizado");

  const currentUser = SIMULATED_USERS.find((u) => u.key === userKey)?.user ?? null;
  const event = { ...MOCK_EVENT, status };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.h1}>Detalle del evento (temporal)</h1>

        <section className={styles.simulation} aria-label="Simulación para pruebas">
          <p className={styles.simTitle}>Simulación para pruebas</p>
          <div className={styles.simFields}>
            <label className={styles.simField}>
              <span>Usuario</span>
              <select
                className={styles.select}
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
              >
                {SIMULATED_USERS.map((u) => (
                  <option key={u.key} value={u.key}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.simField}>
              <span>Estado del evento</span>
              <select
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
              >
                <option value="finalizado">Finalizado</option>
                <option value="publicado">Publicado (aún no termina)</option>
              </select>
            </label>
          </div>
        </section>

        <article className={styles.eventCard}>
          <Image
            className={styles.eventImage}
            src={event.imageSrc}
            alt={`Imagen de ${event.name}`}
            width={101}
            height={108}
          />
          <div>
            <h2 className={styles.eventName}>{event.name}</h2>
            <span
              className={`${styles.status} ${
                event.status === "publicado" ? styles.statusPublished : styles.statusFinished
              }`}
            >
              {STATUS_LABEL[event.status]}
            </span>
          </div>
        </article>
      </div>

      <ReviewsSection event={event} currentUser={currentUser} />
    </main>
  );
}
