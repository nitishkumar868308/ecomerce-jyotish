"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Play, X } from "lucide-react";
import { useCategories } from "@/services/categories";
import { useProductsFast } from "@/services/products";
import { filterByPlatform } from "@/lib/products";
import { ProductCard } from "@/components/store/product/ProductCard";
import { useBanners, useVideoStories } from "@/services/banners";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { resolveAssetUrl } from "@/lib/assetUrl";
import { filterBannersForStorefront } from "@/lib/storefrontFilters";
import { useQuickGoStore } from "@/stores/useQuickGoStore";
import { useLocationStates } from "@/services/admin/location";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
// @ts-ignore
import "swiper/css";
// @ts-ignore
import "swiper/css/pagination";

const features = [
  { icon: "⚡", title: "Super Fast", desc: "Delivery in 1 Day" },
  { icon: "💰", title: "Best Prices", desc: "No hidden charges" },
  { icon: "✔️", title: "Fresh & Quality", desc: "100% quality assured" },
];

export default function QuickGoHomePage() {
  const quickGoCity = useQuickGoStore((s) => s.city);
  const quickGoPincode = useQuickGoStore((s) => s.pincode);
  // Backend filters categories by the QuickGo platform flag + the
  // shopper's city (via the Category→State relation), so we never
  // render a category that's disabled for this location.
  const { data: categories, isLoading: catLoading } = useCategories({
    platform: "quickgo",
    city: quickGoCity || undefined,
  });
  // Use the paginated /products/fast endpoint — same one the categories
  // page uses — so the QuickGo warehouse + pincode filter applies
  // consistently. The legacy /products route doesn't honour those
  // filters, which was making the home grid show more products than the
  // categories grid for the same location.
  const { data: productsData, isLoading: prodLoading } = useProductsFast({
    page: 1,
    limit: 8,
    platform: "quickgo",
    city: quickGoCity || undefined,
    pincode: quickGoPincode || undefined,
  });
  const { data: banners, isLoading: bannerLoading } = useBanners();
  const { data: videoStories } = useVideoStories();
  const { data: locations } = useLocationStates();
  const products = filterByPlatform(
    productsData?.data?.products,
    "quickgo",
  );

  // Resolve the user's picked city back to every Location (State) row with that
  // city — any of those row IDs are a valid match for a banner's states list.
  const cityStateIds = React.useMemo(() => {
    if (!quickGoCity) return [] as number[];
    return (locations ?? [])
      .filter((l) => l.city && l.city.toLowerCase() === quickGoCity.toLowerCase())
      .map((l) => l.id);
  }, [locations, quickGoCity]);

  const activeBanners = React.useMemo(
    () =>
      filterBannersForStorefront(banners, {
        cityStateIds,
      }),
    [banners, cityStateIds],
  );

  const activeVideos = videoStories?.filter((v) => v.active) ?? [];
  const [activeStoryVideo, setActiveStoryVideo] = useState<string | null>(null);

  return (
    <>
      {/* Banner Slider - fully responsive (matches wizard HeroSlider) */}
      {bannerLoading ? (
        <section className="relative w-full bg-[var(--bg-secondary)]">
          <div className="w-full" style={{ paddingBottom: "31.25%" }} />
        </section>
      ) : activeBanners.length > 0 ? (
        <section className="relative w-full overflow-hidden bg-[var(--bg-secondary)]">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{
              clickable: true,
              bulletClass:
                "inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/50 mx-0.5 sm:mx-1 cursor-pointer transition-all duration-300",
              bulletActiveClass: "!bg-white !w-5 sm:!w-7 !rounded-full",
            }}
            loop={activeBanners.length > 1}
            speed={700}
            className="w-full"
          >
            {activeBanners.map((banner, idx) => (
              <SwiperSlide key={banner.id}>
                <div className="relative w-full">
                  <Image
                    src={banner.image ? resolveAssetUrl(banner.image) : "/image/placeholder.jpg"}
                    alt={banner.text || `Banner ${idx + 1}`}
                    width={1920}
                    height={600}
                    className="w-full h-auto object-contain"
                    priority={idx === 0}
                    sizes="100vw"
                  />
                  {banner.text && (
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent">
                      <div className="w-full px-3 pb-6 sm:px-8 sm:pb-10 lg:px-14 lg:pb-16">
                        <h2 className="max-w-2xl text-sm font-bold text-white drop-shadow-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl leading-tight">
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
                <VideoStoryCard
                  key={video.id}
                  video={video}
                  onPlay={() =>
                    setActiveStoryVideo(resolveAssetUrl(video.url) || video.url)
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {activeStoryVideo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActiveStoryVideo(null)}
        >
          <div
            className="relative aspect-[9/16] w-full max-w-sm overflow-hidden rounded-2xl bg-black shadow-2xl sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={activeStoryVideo}
              autoPlay
              controls
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => setActiveStoryVideo(null)}
              aria-label="Close"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
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
                        src={resolveAssetUrl(cat.image)}
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

      {/* Products — shuffled once per mount so a refresh feels fresh
          without the grid reshuffling underneath the user during a
          single session. Same card + grid the categories page uses so
          the stock badge + URL routing + skeletons stay consistent. */}
      {(prodLoading || products.length > 0) && (
        <ProductsSection products={products} loading={prodLoading} />
      )}
    </>
  );
}

const PRODUCTS_PREVIEW_MAX = 10;

function ProductsSection({
  products,
  loading,
}: {
  products: any[];
  loading: boolean;
}) {
  // Fisher-Yates once per mount. Stable while the user is on the page —
  // navigating around and coming back shows the same order — but a hard
  // refresh produces a fresh layout. Ties to the ask: "har refresh pe
  // shuffle".
  const shuffled = React.useMemo(() => {
    const arr = [...products];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // Home is a PREVIEW — a horizontal carousel of curated cards always
  // feels the same whether the shopper has 1 product in stock or 50.
  // The full catalogue lives on /categories. Cards are fixed-width so
  // one stocked item doesn't stretch to fill the whole row, and extras
  // beyond the preview cap stay reachable via the "See all" CTA at the
  // tail of the scroll (+ the header link).
  const preview = shuffled.slice(0, PRODUCTS_PREVIEW_MAX);
  const hasOverflow = shuffled.length > preview.length;

  return (
    <section className="relative py-6 sm:py-8">
      {/* Subtle brand wash behind the section so Products reads as a
          first-class surface rather than a plain list. Sits under
          everything via -z-0. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-r from-[var(--accent-primary)]/[0.06] via-transparent to-emerald-500/[0.06]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[var(--accent-primary)]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)] sm:text-lg">
              Products
            </h2>
            <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
              · ready in minutes
            </span>
            {!loading && shuffled.length > 0 && (
              <span className="ml-1 rounded-full bg-[var(--accent-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent-primary)]">
                {shuffled.length}
              </span>
            )}
          </div>
          <Link
            href="/hecate-quickgo/categories"
            className="shrink-0 text-xs font-medium text-[var(--accent-primary)] hover:underline sm:text-sm"
          >
            See all →
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[160px] shrink-0 sm:w-[200px] md:w-[220px]"
              >
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="mt-2 space-y-2">
                  <Skeleton height={12} width="50%" />
                  <Skeleton height={14} width="80%" />
                </div>
              </div>
            ))}
          </div>
        ) : preview.length === 0 ? null : (
          <div className="-mx-4 px-4 sm:-mx-6 sm:px-6">
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-4 [scrollbar-width:thin]">
              {preview.map((p) => (
                <div
                  key={p.id}
                  className="w-[160px] shrink-0 snap-start sm:w-[200px] md:w-[220px]"
                >
                  <ProductCard product={p} />
                </div>
              ))}

              {/* Tail "See more" card — appears only when there's more
                  catalogue past the preview cap. Shaped like the other
                  cards so the row reads as one continuous rail. */}
              {hasOverflow && (
                <Link
                  href="/hecate-quickgo/categories"
                  className="group flex w-[160px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5 p-4 text-center text-sm font-medium text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 sm:w-[200px] md:w-[220px]"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 transition-transform group-hover:scale-110">
                    <Zap className="h-5 w-5" />
                  </span>
                  <span>See all {shuffled.length} products</span>
                  <span className="text-[10px] font-normal text-[var(--text-muted)]">
                    Browse the full range
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Story tile — the video itself is the thumbnail (muted/looping/autoplay),
 * matching the wizard storefront. Clicking opens the full modal (owner
 * component) with sound and controls.
 */
function VideoStoryCard({
  video,
  onPlay,
}: {
  video: { id: number; title: string; url: string; thumbnail?: string };
  onPlay: () => void;
}) {
  const src = resolveAssetUrl(video.url) || video.url;
  const poster = video.thumbnail ? resolveAssetUrl(video.thumbnail) : undefined;

  return (
    <button
      type="button"
      onClick={onPlay}
      className="group shrink-0 w-[140px] sm:w-[160px] focus:outline-none"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border-2 border-[var(--accent-primary)]/30 bg-[var(--bg-secondary)] transition-transform duration-300 group-hover:scale-[1.03]">
        <video
          src={src}
          poster={poster}
          className="absolute inset-0 h-full w-full object-cover"
          preload="auto"
          playsInline
          loop
          muted
          autoPlay
        />
        {/* Play glyph — fades out on hover to let the preview breathe. */}
        <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-100 transition-opacity duration-300 group-hover:opacity-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-lg">
            <Play
              className="ml-0.5 h-4 w-4 text-[var(--accent-primary)]"
              fill="currentColor"
            />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      <p className="mt-2 line-clamp-1 text-center text-xs font-medium text-[var(--text-primary)]">
        {video.title}
      </p>
    </button>
  );
}
