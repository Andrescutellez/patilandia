"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { submitProductQuestion } from "@/lib/vendure/qa-client";
import type { ProductQuestion } from "@/lib/vendure/qa";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

function QuestionForm({ productId }: { productId: string }) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      await submitProductQuestion({ productId, authorName, authorEmail, question });
      setStatus("done");
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "No se pudo enviar tu pregunta.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-[1.4rem] bg-[var(--brand-soft)] p-5 text-sm text-[var(--ink)]">
        ¡Gracias por tu pregunta! Va a aparecer acá apenas la respondamos.
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-[1.4rem] border border-[var(--line)] bg-white p-5" onSubmit={handleSubmit}>
      <p className="font-bold text-[var(--ink)]">Hacé tu pregunta</p>

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

      <textarea
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Por ejemplo: ¿hasta dónde hacen envíos?"
        required
        rows={3}
        value={question}
      />

      {status === "error" ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <Button disabled={status === "submitting"} type="submit">
        {status === "submitting" ? "Enviando…" : "Enviar pregunta"}
      </Button>
    </form>
  );
}

export function ProductQA({
  productId,
  initialQuestions
}: {
  productId: string;
  initialQuestions: ProductQuestion[];
}) {
  const questions = initialQuestions;
  const [showForm, setShowForm] = useState(false);
  const canAsk = Boolean(productId);

  return (
    <section className="space-y-6 rounded-[2rem] border border-white/60 bg-white/76 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Preguntas y respuestas</h2>
          <p className="mt-3 text-sm text-[var(--muted)]">
            {questions.length > 0
              ? `${questions.length} ${questions.length === 1 ? "pregunta respondida" : "preguntas respondidas"}`
              : "Todavía no hay preguntas — sé la primera persona en preguntar."}
          </p>
        </div>
        {canAsk && !showForm ? (
          <Button onClick={() => setShowForm(true)} type="button" variant="secondary">
            Hacer una pregunta
          </Button>
        ) : null}
      </div>

      {/* Stays mounted after a successful submit — QuestionForm's own "done" branch shows the
          thank-you message in place of the fields (see product-reviews.tsx for the same fix). */}
      {showForm && canAsk ? <QuestionForm productId={productId} /> : null}

      {questions.length > 0 ? (
        <ul className="space-y-4">
          {questions.map((item) => (
            <li className="rounded-[1.4rem] bg-[var(--brand-soft)] p-5" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-[var(--ink)]">{item.authorName} preguntó:</span>
                <span className="text-xs text-[var(--muted)]">
                  {dateFormatter.format(new Date(item.createdAt))}
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.question}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--ink)]">
                <span className="font-bold text-[var(--brand-violet-deep)]">Patilandia responde: </span>
                {item.answer}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
