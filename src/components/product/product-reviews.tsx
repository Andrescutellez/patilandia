"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { submitProductReview } from "@/lib/vendure/reviews-client";
import type { ProductReview } from "@/lib/vendure/reviews";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      await submitProductReview({ productId, authorName, authorEmail, rating, title, body });
      setStatus("done");
      onSubmitted();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo enviar tu reseña.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[1.4rem] bg-[var(--brand-soft)] p-5 text-sm text-[var(--ink)]">
        ¡Gracias por tu reseña! Quedará visible en cuanto la revisemos.
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-[1.4rem] border border-[var(--line)] bg-white p-5" onSubmit={handleSubmit}>
      <p className="font-bold text-[var(--ink)]">Deja tu reseña</p>

      <div className="flex items-center gap-2">
        <span className="text-sm text-[var(--muted)]">Tu calificación:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              aria-label={`${value} estrellas`}
              className="h-7 w-7"
              key={value}
              onClick={() => setRating(value)}
              type="button"
            >
              <RatingStars className="h-6 w-6" rating={value <= rating ? 5 : 0} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setAuthorName(event.target.value)}
          placeholder="Tu nombre"
          required
          type="text"
          value={authorName}
        />
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setAuthorEmail(event.target.value)}
          placeholder="Tu correo"
          required
          type="email"
          value={authorEmail}
        />
      </div>

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Título (opcional)"
        type="text"
        value={title}
      />

      <textarea
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setBody(event.target.value)}
        placeholder="Contanos qué te pareció el producto"
        required
        rows={4}
        value={body}
      />

      {status === "error" ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <Button disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Enviando…" : "Enviar reseña"}
      </Button>
    </form>
  );
}

export function ProductReviews({
  productId,
  initialReviews,
  rating,
  reviewCount
}: {
  productId: string;
  initialReviews: ProductReview[];
  rating: number;
  reviewCount: number;
}) {
  const reviews = initialReviews;
  const [showForm, setShowForm] = useState(false);
  const canReview = Boolean(productId);

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/60 bg-white/76 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Reseñas</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
            {reviewCount > 0 ? (
              <>
                <RatingStars rating={rating} />
                <span className="font-bold text-[var(--ink)]">{rating.toFixed(1)}</span>
                <span>({reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"})</span>
              </>
            ) : (
              <span>Sin reseñas todavía — sé la primera persona en dejar una.</span>
            )}
          </div>
        </div>
        {canReview && !showForm ? (
          <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
            Escribir una reseña
          </Button>
        ) : null}
      </div>

      {showForm && canReview ? (
        <ReviewForm
          onSubmitted={() => {
            setShowForm(false);
          }}
          productId={productId}
        />
      ) : null}

      {reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li className="rounded-[1.4rem] bg-[var(--brand-soft)] p-5" key={review.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <RatingStars className="h-3.5 w-3.5" rating={review.rating} />
                  <span className="font-bold text-[var(--ink)]">{review.authorName}</span>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  {dateFormatter.format(new Date(review.createdAt))}
                </span>
              </div>
              {review.title ? <p className="mt-2 font-bold text-[var(--ink)]">{review.title}</p> : null}
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{review.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
