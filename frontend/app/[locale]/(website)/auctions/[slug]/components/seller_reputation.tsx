import { Star, BadgeCheck, MessageSquareQuote } from 'lucide-react';

import type { SellerReviewsView } from '@/lib/server/data';

interface SellerReputationProps {
  data: SellerReviewsView;
  sellerName?: string;
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rounded >= star;
        const half = !filled && rounded >= star - 0.5;
        return (
          <Star
            key={star}
            width={size}
            height={size}
            className={
              filled || half
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-muted-foreground/40'
            }
          />
        );
      })}
    </span>
  );
}

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Seller reputation tab on the lot page. Consumes the public
 * GET /sellers/:id/reviews route, which is already anonymised server-side —
 * no buyer identity reaches this component.
 */
export default function SellerReputation({ data, sellerName }: SellerReputationProps) {
  const { reviews, total, averageRating, ratingBreakdown } = data;

  if (total === 0) {
    return (
      <div className="rounded-lg border border-border/50 p-6 text-center">
        <p className="text-sm font-medium text-foreground">No reviews yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {sellerName ? `${sellerName} has` : 'This seller has'} not received any buyer
          reviews so far.
        </p>
      </div>
    );
  }

  const maxCount = Math.max(
    1,
    ...Object.values(ratingBreakdown).map((value) => Number(value) || 0),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 p-4 text-center">
          <p className="text-4xl font-extrabold tracking-tight text-foreground">
            {averageRating.toFixed(1)}
          </p>
          <div className="mt-1">
            <Stars rating={averageRating} size={18} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {total} verified {total === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(ratingBreakdown[star] ?? 0);
            const pct = Math.round((count / maxCount) * 100);
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 shrink-0 text-xs tabular-nums text-muted-foreground">
                  {star}
                </span>
                <Star width={12} height={12} className="shrink-0 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {reviews.map((review) => (
          <article key={review.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <Stars rating={Number(review.rating) || 0} size={14} />
              {review.title ? (
                <h4 className="text-sm font-semibold text-foreground">{review.title}</h4>
              ) : null}
              {review.is_verified_purchase ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <BadgeCheck className="h-3 w-3" />
                  Verified purchase
                </span>
              ) : null}
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(review.created_at)}
              </span>
            </div>

            {review.comment ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
            ) : null}

            {review.response ? (
              <div className="flex gap-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Seller response
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground">
                    {review.response}
                  </p>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {total > reviews.length ? (
        <p className="text-xs text-muted-foreground">
          Showing {reviews.length} of {total} reviews.
        </p>
      ) : null}
    </div>
  );
}
