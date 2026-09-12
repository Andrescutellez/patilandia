import { StarIcon } from "@/components/ui/icons";

/** Proportional star display — only fills as many stars as the rounded rating, instead of
 *  always drawing 5 gold stars regardless of the real value (misleading for low/zero ratings). */
export function RatingStars({ rating, className = "h-4 w-4" }: { rating: number; className?: string }) {
  const filled = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          className={index < filled ? `${className} text-amber-400` : `${className} text-[var(--line)]`}
        />
      ))}
    </div>
  );
}
