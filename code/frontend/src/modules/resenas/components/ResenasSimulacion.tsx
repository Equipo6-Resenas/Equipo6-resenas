"use client";

import { SIMULATED_USERS } from "../mockData";
import type { EventStatus } from "../types";
import styles from "./simulacion.module.css";

interface ResenasSimulacionProps {
  userKey: string;
  onUserChange: (key: string) => void;
  status: EventStatus;
  onStatusChange: (status: EventStatus) => void;
}

/**
 * Panel TEMPORAL para probar los distintos casos (asistente, organizador…)
 * mientras no esté integrado el módulo Auth. Se oculta con
 * NEXT_PUBLIC_RESENAS_SIMULAR=false y se elimina al conectar sesión real.
 */
export default function ResenasSimulacion({
  userKey,
  onUserChange,
  status,
  onStatusChange,
}: ResenasSimulacionProps) {
  return (
    <section className={styles.simulation} aria-label="Simulación para pruebas">
      <p className={styles.simTitle}>Simulación para pruebas (temporal)</p>
      <div className={styles.simFields}>
        <label className={styles.simField}>
          <span>Usuario</span>
          <select
            className={styles.select}
            value={userKey}
            onChange={(e) => onUserChange(e.target.value)}
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
            onChange={(e) => onStatusChange(e.target.value as EventStatus)}
          >
            <option value="finalizado">Finalizado</option>
            <option value="publicado">Publicado (aún no termina)</option>
          </select>
        </label>
      </div>
    </section>
  );
}
