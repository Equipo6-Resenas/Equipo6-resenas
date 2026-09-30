"use client";

import { useCallback, useMemo, useState } from "react";
import { createMockReviews } from "./mockData";
import type { CurrentUser, NewReviewInput, Review } from "./types";

/**
 * Estado local de reseñas. TODO: reemplazar por fetch/mutaciones contra la API
 * del backend; la firma de addReview y addReply puede mantenerse.
 */
export function useReviews(eventId: string) {
  const [reviews, setReviews] = useState<Review[]>(() =>
    createMockReviews(eventId),
  );

  /** Reseñas ordenadas de la más nueva a la más antigua. */
  const sorted = useMemo(
    () =>
      [...reviews].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [reviews],
  );

  const addReview = useCallback(
    (user: CurrentUser, input: NewReviewInput) => {
      setReviews((prev) => {
        // Una reseña por usuario por evento
        if (prev.some((r) => r.userId === user.id)) return prev;
        const review: Review = {
          id: crypto.randomUUID(),
          eventId,
          userId: user.id,
          userName: user.name,
          rating: input.rating,
          comment: input.comment,
          createdAt: new Date().toISOString(),
        };
        return [review, ...prev];
      });
    },
    [eventId],
  );

  const addReply = useCallback(
    (reviewId: string, author: CurrentUser, text: string) => {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId && !r.reply
            ? {
                ...r,
                reply: {
                  id: crypto.randomUUID(),
                  authorName: author.name,
                  text,
                  createdAt: new Date().toISOString(),
                },
              }
            : r,
        ),
      );
    },
    [],
  );

  return { reviews: sorted, addReview, addReply };
}
