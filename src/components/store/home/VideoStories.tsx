"use client";

import { useVideoStories } from "@/services/banners";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Play, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { resolveAssetUrl } from "@/lib/assetUrl";

/**
 * Our Stories — video-first carousel.
 *
 * Each tile auto-plays the video itself as the preview (muted, looping,
 * inline). Clicking a tile opens the full modal with sound and controls.
 * This removes the old canvas-thumbnail dance, which could silently fail
 * on cross-origin videos and was redundant now that the brief is "the
 * video is the thumbnail".
 */
export default function VideoStories() {
  const { data: stories, isLoading } = useVideoStories();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!stories?.length) return;
    const el = scrollRef.current;
    if (!el) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!el) return;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 10) {
          el.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          el.scrollBy({ left: 130, behavior: "smooth" });
        }
      }, 3000);
    };

    startAutoScroll();

    const pause = () => clearInterval(autoScrollRef.current);
    const resume = () => {
      clearInterval(autoScrollRef.current);
      startAutoScroll();
    };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);

    return () => {
      clearInterval(autoScrollRef.current);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [stories?.length]);

  if (isLoading) {
    return (
      <section className="py-6 sm:py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">
            Our Stories
          </h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-[90px] h-[140px] sm:w-[110px] sm:h-[170px] lg:w-[120px] lg:h-[180px] rounded-2xl shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stories?.length) return null;

  return (
    <section className="py-6 sm:py-8 lg:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">
          Our Stories
        </h2>
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide"
        >
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onPlay={() => setActiveVideo(resolveAssetUrl(story.url))}
            />
          ))}
        </div>
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={activeVideo}
              autoPlay
              controls
              className="h-full w-full object-contain"
            />
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function StoryCard({
  story,
  onPlay,
}: {
  story: { id: number; title: string; url: string; thumbnail?: string };
  onPlay: () => void;
}) {
  const src = resolveAssetUrl(story.url);
  return (
    <button
      onClick={onPlay}
      className="relative w-[90px] h-[140px] sm:w-[110px] sm:h-[170px] lg:w-[120px] lg:h-[180px] shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--accent-primary)] bg-[var(--bg-tertiary)] group focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 transition-transform duration-300 hover:scale-105"
    >
      {/* Video itself is the thumbnail — muted/looped/inline preview. */}
      <video
        src={src}
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        poster={
          story.thumbnail ? resolveAssetUrl(story.thumbnail) : undefined
        }
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Play overlay glyph — disappears on hover. */}
      <div className="absolute inset-0 flex items-end justify-center pb-8 sm:pb-10 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
        <div className="rounded-full bg-white/80 p-1.5 sm:p-2 shadow-lg backdrop-blur-sm">
          <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--accent-primary)] fill-[var(--accent-primary)]" />
        </div>
      </div>

      {/* Bottom gradient + title */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      {story.title && (
        <p className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] sm:text-[10px] font-medium text-white truncate drop-shadow-md">
          {story.title}
        </p>
      )}
    </button>
  );
}
