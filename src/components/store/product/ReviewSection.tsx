"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, MessageSquarePlus } from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { useReviews, useCreateReview } from "@/services/reviews";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHasDeliveredProduct } from "@/hooks/useHasDeliveredProduct";
import type { Review } from "@/types/review";

interface ReviewSectionProps {
  productId: string | number;
  className?: string;
}

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            i < rating
              ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]"
              : "text-[var(--border-primary)]"
          )}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform duration-100 hover:scale-110"
            aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-7 w-7",
                starValue <= (hover || value)
                  ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]"
                  : "text-[var(--border-primary)]"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b border-[var(--border-primary)] py-5 last:border-b-0">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary-light)] text-sm font-bold text-[var(--accent-primary)]">
          {review.user?.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            getInitials(review.user?.name || "User")
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {review.user?.name || "Anonymous"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {formatDate(review.createdAt)}
              </p>
            </div>
            <StarRating rating={review.rating} />
          </div>

          {review.title && (
            <h4 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
              {review.title}
            </h4>
          )}

          <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
            {review.comment}
          </p>

          {review.images && review.images.length > 0 && (
            <div className="mt-3 flex gap-2">
              {review.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Review image ${idx + 1}`}
                  className="h-16 w-16 rounded-lg border border-[var(--border-primary)] object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const average =
    total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: total > 0 ? (reviews.filter((r) => r.rating === star).length / total) * 100 : 0,
  }));

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
      <div className="text-center">
        <p className="text-5xl font-bold text-[var(--text-primary)]">
          {average.toFixed(1)}
        </p>
        <StarRating rating={Math.round(average)} size="md" />
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {total} review{total !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex-1 space-y-2">
        {breakdown.map(({ star, count, percentage }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="w-3 text-sm font-medium text-[var(--text-secondary)]">
              {star}
            </span>
            <Star className="h-3.5 w-3.5 fill-[var(--accent-warning)] text-[var(--accent-warning)]" />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--accent-warning)] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-[var(--text-secondary)]">
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewSection({ productId, className }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const { isLoggedIn } = useAuthStore();
  const { hasDelivered, isLoading: checkingOrders } = useHasDeliveredProduct(
    isLoggedIn ? productId : null
  );

  const { data, isLoading } = useReviews({ productId });
  const createReview = useCreateReview();

  const reviews = data?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    createReview.mutate(
      { productId, rating, title: title || undefined, comment },
      {
        onSuccess: () => {
          setShowForm(false);
          setRating(0);
          setTitle("");
          setComment("");
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex gap-8">
          <Skeleton width={120} height={80} />
          <div className="flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={10} />
            ))}
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-4">
            <Skeleton variant="circle" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton height={14} width="30%" />
              <Skeleton variant="text" lines={2} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Rating Breakdown */}
      <RatingBreakdown reviews={reviews} />

      {/* Write Review Button */}
      <div className="flex flex-col items-end">
        <Button
          onClick={() => setShowForm(true)}
          leftIcon={<MessageSquarePlus className="h-4 w-4" />}
          disabled={!isLoggedIn || checkingOrders || !hasDelivered}
        >
          {checkingOrders ? "Checking…" : "Write a Review"}
        </Button>
        {isLoggedIn && !checkingOrders && !hasDelivered && (
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Order karne aur delivery hone ke baad hi rating and review de sakte ho. Lekin aap doosre reviews yahan padh sakte ho.
          </p>
        )}
        {!isLoggedIn && (
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Login karo taaki review likh sako — reviews padhna sabke liye open hai.
          </p>
        )}
      </div>

      {/* Reviews List */}
      <div>
        {reviews.length === 0 ? (
          <div className="py-10 text-center">
            <ThumbsUp className="mx-auto h-10 w-10 text-[var(--text-secondary)]" />
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              No reviews yet. Be the first to review this product!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Review Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Write a Review"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Your Rating
            </label>
            <InteractiveStarRating value={rating} onChange={setRating} />
            {rating === 0 && (
              <p className="mt-1 text-xs text-[var(--accent-danger)]">
                Please select a rating
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="review-title"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              Title (optional)
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sum up your experience"
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            />
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
            >
              Your Review
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience with this product..."
              rows={4}
              required
              className="w-full resize-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-input)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createReview.isPending}
              disabled={rating === 0 || !comment.trim()}
            >
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default ReviewSection;
