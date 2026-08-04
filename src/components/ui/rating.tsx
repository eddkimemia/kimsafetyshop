import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  rating,
  reviews,
  size = "sm",
  className,
}: {
  rating: number;
  reviews?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  const star = size === "xs" ? "h-3 w-3" : size === "sm" ? "h-3.5 w-3.5" : "h-4.5 w-4.5";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <Star key={i} className={cn(star, "fill-amber-400 text-amber-400")} />;
          if (i === full && half) return <StarHalf key={i} className={cn(star, "fill-amber-400 text-amber-400")} />;
          return <Star key={i} className={cn(star, "text-gray-300")} />;
        })}
      </div>
      {reviews !== undefined && (
        <span className="text-xs text-gray-500">
          {rating.toFixed(1)} ({reviews.toLocaleString()})
        </span>
      )}
    </div>
  );
}
