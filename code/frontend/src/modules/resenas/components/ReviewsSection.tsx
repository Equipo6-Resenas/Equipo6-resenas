"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { CheckIcon, InfoIcon, TriangleIcon } from "./icons";
import { inter, poppins } from "../fonts";
import { hasCheckIn } from "../mockData";
import {
  BLOCK_MESSAGES,
  canReplyToReviews,
  getReviewEligibility,
} from "../permissions";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { StarDisplay } from "./Stars";
import type { CurrentUser, NewReviewInput, ReviewEvent } from "../types";
import { useReviews } from "../useReviews";
import styles from "./reviews.module.css";

/** Cuántas reseñas se ven antes de pulsar "Ver todas las reseñas". */
const PREVIEW_COUNT = 3;

interface ReviewsSectionProps {
  event: ReviewEvent;
  /** Usuario con sesión iniciada (null = visitante). Lo entrega el módulo de autenticación. */
  currentUser: CurrentUser | null;
}

export function ReviewsSection({ event, currentUser }: ReviewsSectionProps) {
  const panelId = useId();
  const { reviews, addReview, addReply } = useReviews(event.id);

  const [open, setOpen] = useState(false); // Estado 1: colapsado por defecto
  const [showAll, setShowAll] = useState(false);
  const [justPublishedBy, setJustPublishedBy] = useState<string | null>(null);

  const eligibility = getReviewEligibility({
    event,
    user: currentUser,
    hasCheckIn: currentUser ? hasCheckIn(currentUser.id) : false,
    reviews,
  });
  const canReply = canReplyToReviews(currentUser, event);

  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const visible = showAll ? reviews : reviews.slice(0, PREVIEW_COUNT);

  function handleSubmit(input: NewReviewInput) {
    if (!currentUser) return;
    addReview(currentUser, input);
    setJustPublishedBy(currentUser.id);
  }

  function renderReviewArea() {
    if (eligibility.canReview) {
      return <ReviewForm onSubmit={handleSubmit} />;
    }
    if (
      eligibility.reason === "already-reviewed" &&
      currentUser &&
      justPublishedBy === currentUser.id
    ) {
      return (
        <p className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
          <CheckIcon />
          Tu reseña ya está publicada. ¡Gracias por compartir tu experiencia!
        </p>
      );
    }
    return (
      <p
        className={`${styles.notice} ${
          eligibility.reason === "already-reviewed" ? styles.noticeSuccess : styles.noticeInfo
        }`}
        role="status"
      >
        {eligibility.reason === "already-reviewed" ? <CheckIcon /> : <InfoIcon />}
        {BLOCK_MESSAGES[eligibility.reason]}
      </p>
    );
  }

  return (
    <section
      className={`${styles.root} ${inter.variable} ${poppins.variable}`}
      aria-label="Reseñas del evento"
    >
      <div className={styles.toggleRow}>
        <span className={styles.line} aria-hidden="true" />
        <button
          type="button"
          className={styles.toggleButton}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Ocultar reseñas" : "Ver reseñas"}
          <TriangleIcon up={open} />
        </button>
        <span className={styles.line} aria-hidden="true" />
      </div>

      {open && (
        <div id={panelId} className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h2 className={styles.title}>Reseñas del evento</h2>
              <p className={styles.subtitle}>
                Opiniones y calificaciones reales de asistentes que vivieron el evento en
                primera fila.
              </p>
            </div>

            <div className={styles.summary}>
              <Image
                className={styles.summaryImage}
                src={event.imageSrc}
                alt={`Imagen de ${event.name}`}
                width={101}
                height={108}
              />
              <div className={styles.summaryBody}>
                {total > 0 ? (
                  <>
                    <p className={styles.score}>
                      <span className={styles.scoreValue}>{average.toFixed(1)}</span>
                      <span className={styles.scoreMax}>/ 5.0</span>
                    </p>
                    <StarDisplay rating={average} size={14} />
                    <p className={styles.summaryCaption}>
                      Basado en {total.toLocaleString("es-CL")}{" "}
                      {total === 1 ? "reseña real" : "reseñas reales"}
                    </p>
                  </>
                ) : (
                  <p className={styles.summaryCaption}>Aún sin calificaciones</p>
                )}
              </div>
            </div>
          </div>

          {renderReviewArea()}

          {total === 0 ? (
            <p className={styles.empty}>Aún no hay reseñas para este evento.</p>
          ) : (
            <div className={styles.list}>
              {visible.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  canReply={canReply}
                  onReply={(reviewId, text) =>
                    currentUser && addReply(reviewId, currentUser, text)
                  }
                />
              ))}
            </div>
          )}

          {total > PREVIEW_COUNT && (
            <div className={styles.moreRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Ver menos reseñas" : "Ver todas las reseñas"}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
