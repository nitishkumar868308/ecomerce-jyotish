"use client";

import { Star, Quote } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Priya Sharma",
    location: "Delhi",
    rating: 5,
    text: "Amazing quality products! The candles are absolutely divine. Packaging was excellent and delivery was on time. Will definitely order again.",
    avatar: null,
  },
  {
    id: 2,
    name: "Rahul Verma",
    location: "Mumbai",
    rating: 5,
    text: "Best online store for spiritual products. The crystals I ordered were genuine and beautifully crafted. Customer support was very helpful too.",
    avatar: null,
  },
  {
    id: 3,
    name: "Sneha Patel",
    location: "Bangalore",
    rating: 4,
    text: "Love the variety of products available. The oils are pure and the herbs are fresh. Great experience shopping here!",
    avatar: null,
  },
  {
    id: 4,
    name: "Amit Kumar",
    location: "Kolkata",
    rating: 5,
    text: "The astrology consultation was incredibly accurate and insightful. The astrologer was patient and gave detailed explanations. Highly recommended!",
    avatar: null,
  },
  {
    id: 5,
    name: "Meera Reddy",
    location: "Hyderabad",
    rating: 5,
    text: "Beautiful handcrafted products. Each item feels special and unique. The attention to detail is remarkable. A truly premium shopping experience.",
    avatar: null,
  },
];

export default function Testimonials() {
  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] lg:text-3xl">
            What Our Customers Say
          </h2>
          <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-[var(--text-muted)]">
            Trusted by thousands of happy customers
          </p>
        </div>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          breakpoints={{
            480: { slidesPerView: 1, spaceBetween: 16 },
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
          }}
          className="pb-4"
        >
          {TESTIMONIALS.map((t) => (
            <SwiperSlide key={t.id} className="!h-auto">
              <div className="flex flex-col h-full min-h-[220px] sm:min-h-[240px] rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:p-6 transition-shadow hover:shadow-[var(--shadow-md)]">
                {/* Quote icon */}
                <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--accent-primary)]/30 mb-2 sm:mb-3 shrink-0" />

                {/* Review text - flex-1 to push footer down */}
                <div className="flex-1 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                {/* Footer - always at bottom */}
                <div className="shrink-0">
                  {/* Star rating */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mb-2 sm:mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                          i < t.rating
                            ? "text-[var(--accent-secondary)] fill-[var(--accent-secondary)]"
                            : "text-[var(--border-primary)]"
                        }`}
                      />
                    ))}
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-xs sm:text-sm font-bold text-white shrink-0">
                      {t.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                        {t.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                        {t.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
