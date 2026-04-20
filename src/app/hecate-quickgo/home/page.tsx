"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, Play } from "lucide-react";
import { useCategories } from "@/services/categories";
import { useProducts } from "@/services/products";
import { filterByPlatform } from "@/lib/products";
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
  { icon: "⚡", title: "Super Fast", desc: "Delivery in 10 minutes" },
  { icon: "💰", title: "Best Prices", desc: "No hidden charges" },
  { icon: "✔️", title: "Fresh & Quality", desc: "100% quality assured" },
];

export default function QuickGoHomePage() {
  const quickGoCity = useQuickGoStore((s) => s.city);
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: productsData, isLoading: prodLoading } = useProducts({
    limit: 8,
    platform: "quickgo",
    // Pass the shopper's selected QuickGo city through to the backend so
    // products can be filtered to those with stock in that city warehouse.
    city: quickGoCity || undefined,
  });
  const { data: banners, isLoading: bannerLoading } = useBanners();
  const { data: videoStories } = useVideoStories();
  const { data: locations } = useLocationStates();
  const products = filterByPlatform(productsData?.data, "quickgo");

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
        <TodaysPicks products={products} />
      ) : null}
    </>
  );
}

/**
 * Today's Picks — replaces the flat "Popular Products" grid with a curated
 * hero + grid layout so a handful of products feel intentional instead of
 * sparse. First product is the hero card (double width + gradient halo),
 * the rest fall into a compact grid on the right.
 */
function TodaysPicks({ products }: { products: any[] }) {
  if (products.length === 0) return null;
  const [hero, ...rest] = products;
  const heroImg = resolveAssetUrl(
    Array.isArray(hero.image) ? hero.image[0] : hero.images?.[0] || hero.image,
  );
  const heroHref = `/hecate-quickgo/product/${hero.slug || hero._id || hero.id}`;

  return (
    <section className="border-t border-[var(--border-primary)] py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-primary)]">
              <Zap className="h-3 w-3" /> Hand-picked
            </span>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl text-[var(--text-primary)]">
              Today&apos;s Picks
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Fresh finds shortlisted by our team, ready in minutes.
            </p>
          </div>
          <Link
            href="/hecate-quickgo/categories"
            className="hidden shrink-0 text-sm font-medium text-[var(--accent-primary)] hover:underline sm:inline"
          >
            See everything →
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Hero pick */}
          <Link
            href={heroHref}
            className="group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-gradient-to-br from-[var(--accent-primary)]/10 via-[var(--bg-card)] to-emerald-500/10 p-5 sm:p-6 min-h-[260px]"
          >
            <div className="absolute inset-0 -z-0 opacity-40 transition-opacity group-hover:opacity-60">
              {heroImg ? (
                <Image
                  src={heroImg}
                  alt={hero.name}
                  fill
                  className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-primary)] shadow-sm backdrop-blur dark:bg-black/50">
                Editor&apos;s choice
              </span>
              <h3 className="mt-2 text-lg font-bold leading-tight text-[var(--text-primary)] sm:text-xl">
                {hero.name}
              </h3>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[var(--accent-primary)]">
                  {hero.currencySymbol || "₹"}
                  {hero.price}
                </span>
                {hero.MRP && Number(hero.MRP) > Number(hero.price) && (
                  <span className="text-sm text-[var(--text-muted)] line-through">
                    {hero.currencySymbol || "₹"}
                    {hero.MRP}
                  </span>
                )}
              </div>
            </div>
          </Link>

          {/* Secondary picks */}
          <div className="grid grid-cols-2 gap-3">
            {rest.slice(0, 4).map((p: any) => {
              const rawImg = Array.isArray(p.image)
                ? p.image[0]
                : p.images?.[0] || p.image;
              const resolved = resolveAssetUrl(rawImg);
              return (
                <Link
                  key={p._id || p.id}
                  href={`/hecate-quickgo/product/${p.slug || p._id || p.id}`}
                  className="group flex flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/40 hover:shadow-md"
                >
                  {resolved ? (
                    <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
                      <Image
                        src={resolved}
                        alt={p.name}
                        fill
                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 20vw"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-24 w-full items-center justify-center rounded-lg bg-[var(--accent-primary)]/5 text-2xl">
                      {p.name?.[0]}
                    </div>
                  )}
                  <h3 className="line-clamp-2 text-xs font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)]">
                    {p.name}
                  </h3>
                  <p className="mt-auto pt-1 text-sm font-bold text-[var(--accent-primary)]">
                    {p.currencySymbol || "₹"}
                    {p.price}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {rest.length > 4 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {rest.slice(4).map((p: any) => {
              const rawImg = Array.isArray(p.image)
                ? p.image[0]
                : p.images?.[0] || p.image;
              const resolved = resolveAssetUrl(rawImg);
              return (
                <Link
                  key={p._id || p.id}
                  href={`/hecate-quickgo/product/${p.slug || p._id || p.id}`}
                  className="group flex w-[150px] shrink-0 flex-col rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-2 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  {resolved ? (
                    <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg bg-[var(--bg-secondary)]">
                      <Image
                        src={resolved}
                        alt={p.name}
                        fill
                        className="object-contain"
                        sizes="150px"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="mb-2 flex h-20 w-full items-center justify-center rounded-lg bg-[var(--accent-primary)]/5">
                      {p.name?.[0]}
                    </div>
                  )}
                  <h4 className="line-clamp-2 text-[11px] font-medium leading-tight text-[var(--text-primary)]">
                    {p.name}
                  </h4>
                  <p className="mt-1 text-xs font-bold text-[var(--accent-primary)]">
                    {p.currencySymbol || "₹"}
                    {p.price}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
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
