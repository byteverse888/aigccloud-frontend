'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, onRate, readonly = false, size = 'md' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hoverRating ? star <= hoverRating : star <= Math.round(rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRate?.(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
      {rating > 0 && (
        <span className="ml-1 text-sm text-muted-foreground">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
