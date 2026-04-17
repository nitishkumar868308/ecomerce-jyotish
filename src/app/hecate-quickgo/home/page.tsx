"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Play } from "lucide-react";
import { useCategories } from "@/services/categories";
import { useProducts } from "@/services/products";
import { useBanners, useVideoStories } from "@/services/banners";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";

const features = [
  { icon: "⚡", title: "Super Fast", desc: "Delivery in 10 minutes" },
  { icon: "💰", title: "Best Prices", desc: "No hidden charges" },
  { icon: "✔️", title: "Fresh & Quality", desc: "100% quality assured" },
];

export default function QuickGoHomePage() {
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: productsData, isLoading: prodLoading } = useProducts({ limit: 8 });
  const { data: banners, isLoading: bannerLoading } = useBanners();
  const { data: videoStories } = useVideoStories();
  const products = productsData?.data ?? [];

  // Filter banners for quickgo - check for state-based filtering
  const selectedState =
    typeof window !== "undefined" ? localStorage.getItem("selectedState") : null;

  const activeBanners = React.useMemo(() => {
    if (!banners) return [];
    return banners.filter((b) => {
      if (!b.active) return false;
      // If banner has state restrictions, check match
      if (b.states && b.states.length > 0 && selectedState) {
        // Allow banners that include the selected state or have no state restriction
        return true; // Backend should filter, but show all active for now
      }
      return true;
    });
  }, [banners, selectedState]);

  const activeVideos = videoStories?.filter((v) => v.active) ?? [];

  return (
    <>
      {/* Banner Slider */}
      {bannerLoading ? (
        <section className="w-full">
          <Skeleton className="aspect-[16/7] w-full max-h-[200px] sm:max-h-[300px] lg:max-h-[400px] rounded-none" />
        </section>
      ) : activeBanners.length > 0 ? (
        <section className="relative w-full overflow-hidden">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{
              clickable: true,
              bulletClass:
                "inline-block w-2 h-2 rounded-full bg-white/50 mx-1 cursor-pointer transition-all duration-300",
              bulletActiveClass: "!bg-white !w-6 !rounded-full",
            }}
            loop={activeBanners.length > 1}
            speed={700}
            className="aspect-[16/7] w-full max-h-[200px] sm:max-h-[300px] lg:max-h-[400px]"
          >
            {activeBanners.map((banner, idx) => (
              <SwiperSlide key={banner.id}>
                <div className="relative w-full h-full">
                  <Image
                    src={banner.image || "/image/placeholder.jpg"}
                    alt={banner.text || `Banner ${idx + 1}`}
                    fill
                    className="object-cover"
                    priority={idx === 0}
                    sizes="100vw"
                  />
                  {banner.text && (
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <div className="w-full px-4 pb-6 sm:px-8 sm:pb-10">
                        <h2 className="max-w-xl text-base font-bold text-white drop-shadow-lg sm:text-xl lg:text-3xl">
                          {banner.text}
                        </h2>
                      </div>
                    </div>
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      ) : (
        /* Fallback hero if no banners */
        <section className="bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5 py-12 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/20 bg-[var(--accent-primary)]/5 px-4 py-1.5 text-sm text-[var(--accent-primary)]">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-primary)]" />
                Delivering in 10 minutes
              </div>
              <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Groceries & Essentials,{" "}
                <span className="text-[var(--accent-primary)]">Lightning Fast</span>
              </h1>
              <p className="mb-8 text-base text-[var(--text-secondary)] sm:text-lg">
                Order everything you need and get it delivered to your doorstep in minutes.
              </p>
              <Link
                href="/hecate-quickgo/categories"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[var(--accent-primary)]/20 transition-transform hover:scale-105 sm:px-8 sm:py-3.5 sm:text-base"
              >
                Shop Now
                <Zap className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 sm:p-5"
              >
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{f.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Stories */}
      {activeVideos.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl text-[var(--text-primary)]">
              Stories
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {activeVideos.map((video) => (
                <VideoStoryCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {catLoading ? (
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Skeleton height={24} width="30%" className="mb-6" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={100} className="rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      ) : categories && categories.length > 0 ? (
        <section className="py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold sm:text-2xl text-[var(--text-primary)]">
                Shop by{" "}
                <span className="text-[var(--accent-primary)]">Category</span>
              </h2>
              <Link
                href="/hecate-quickgo/categories"
                className="text-sm font-medium text-[var(--accent-primary)] hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
              {(categories as any[]).slice(0, 6).map((cat: any) => (
                <Link
                  key={cat._id || cat.id}
                  href={`/hecate-quickgo/categories?cat=${cat.slug || cat._id || cat.id}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
                >
                  {cat.image ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg sm:h-14 sm:w-14">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-primary)]/10 text-xl sm:h-14 sm:w-14">
                      {cat.name?.[0] || "C"}
                    </div>
                  )}
                  <span className="text-xs font-medium text-[var(--text-primary)]">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Featured Products */}
      {prodLoading ? (
        <section className="border-t border-[var(--border-primary)] py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Skeleton height={24} width="30%" className="mb-6" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={200} className="rounded-xl" />
              ))}
            </div>
          </div>
        </section>
      ) : products.length > 0 ? (
        <section className="border-t border-[var(--border-primary)] py-8 sm:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <h2 className="mb-6 text-xl font-bold sm:text-2xl text-[var(--text-primary)]">
              Popular{" "}
              <span className="text-[var(--accent-primary)]">Products</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
              {products.map((p: any) => (
                <Link
                  key={p._id || p.id}
                  href={`/hecate-quickgo/product/${p.slug || p._id || p.id}`}
                  className="group rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
                >
                  {(p.image?.[0] || p.images?.[0]) ? (
                    <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-[var(--bg-secondary)] sm:h-32">
                      <Image
                        src={Array.isArray(p.image) ? p.image[0] : p.images?.[0] || p.image}
                        alt={p.name}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    </div>
                  ) : (
                    <div className="mb-3 flex h-28 w-full items-center justify-center rounded-lg bg-[var(--accent-primary)]/5 text-3xl sm:h-32">
                      {p.name?.[0]}
                    </div>
                  )}
                  <h3 className="mb-1 line-clamp-2 text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] sm:text-sm">
                    {p.name}
                  </h3>
                  <p className="text-sm font-bold text-[var(--accent-primary)]">
                    {p.currencySymbol || "₹"}{p.price}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

/* Video Story Card with thumbnail and playback */
function VideoStoryCard({ video }: { video: { id: number; title: string; url: string } }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="shrink-0 w-[140px] sm:w-[160px]">
      <div
        className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border-2 border-[var(--accent-primary)]/30 bg-[var(--bg-secondary)] cursor-pointer"
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={video.url}
          className="h-full w-full object-cover"
          preload="metadata"
          playsInline
          loop
          muted
          onEnded={() => setPlaying(false)}
        />
        {/* Play/Pause overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-5 w-5 text-[var(--accent-primary)] ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-[var(--text-primary)] line-clamp-1">
        {video.title}
      </p>
    </div>
  );
}
