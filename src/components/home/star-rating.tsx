"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={label ?? `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-4",
            star <= rounded ? "fill-highlight text-highlight" : "text-muted-foreground/35",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

export function StarRatingField({ error }: { error?: string }) {
  const [value, setValue] = useState(0);
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium" id="avis-note">
        Note
      </p>
      <div
        role="radiogroup"
        aria-labelledby="avis-note"
        className="flex gap-1"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <label
            key={star}
            className="cursor-pointer rounded-md p-1 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            onMouseEnter={() => setHover(star)}
          >
            <input
              type="radio"
              name="rating"
              value={star}
              className="sr-only"
              checked={value === star}
              onChange={() => setValue(star)}
              required
            />
            <Star
              className={cn(
                "size-6",
                star <= shown ? "fill-highlight text-highlight" : "text-muted-foreground/40",
              )}
              aria-hidden
            />
            <span className="sr-only">{star} sur 5</span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
