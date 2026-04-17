"use client";

import { useVideoStories } from "@/services/banners";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { Play, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function VideoStories() {
  const { data: stories, isLoading } = useVideoStories();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Auto-scroll thumbnails
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
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Our Stories</h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-[90px] h-[140px] sm:w-[110px] sm:h-[170px] lg:w-[120px] lg:h-[180px] rounded-2xl shrink-0" />
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
              onPlay={() => setActiveVideo(story.url)}
            />
          ))}
        </div>
      </div>

      {/* Video Modal */}
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [thumbReady, setThumbReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate thumbnail from video first frame
  useEffect(() => {
    if (story.thumbnail) {
      setThumbReady(true);
      return;
    }
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = story.url;

    const handleLoaded = () => {
      video.currentTime = 0.5;
    };
    const handleSeeked = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        setThumbReady(true);
      }
      video.remove();
    };

    video.addEventListener("loadeddata", handleLoaded);
    video.addEventListener("seeked", handleSeeked);
    video.load();

    return () => {
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("seeked", handleSeeked);
      video.remove();
    };
  }, [story.url, story.thumbnail]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <button
      onClick={onPlay}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-[90px] h-[140px] sm:w-[110px] sm:h-[170px] lg:w-[120px] lg:h-[180px] shrink-0 overflow-hidden rounded-2xl border-2 border-[var(--accent-primary)] bg-[var(--bg-tertiary)] group focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 transition-transform duration-300 hover:scale-105"
    >
      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview video (on hover) */}
      <video
        ref={videoRef}
        src={story.url}
        muted
        loop
        playsInline
        preload="metadata"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isHovering ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Thumbnail poster - from API or generated from video */}
      {story.thumbnail ? (
        <img
          src={story.thumbnail}
          alt={story.title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            isHovering ? "opacity-0" : "opacity-100"
          )}
        />
      ) : thumbReady && canvasRef.current ? (
        <img
          src={canvasRef.current.toDataURL()}
          alt={story.title}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            isHovering ? "opacity-0" : "opacity-100"
          )}
        />
      ) : (
        <div className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-b from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/40 transition-opacity",
          isHovering ? "opacity-0" : "opacity-100"
        )}>
          <Play className="h-6 w-6 sm:h-8 sm:w-8 text-[var(--accent-primary)]" />
        </div>
      )}

      {/* Play overlay */}
      <div className={cn(
        "absolute inset-0 flex items-end justify-center pb-8 sm:pb-10 transition-opacity duration-300",
        isHovering ? "opacity-0" : "opacity-100"
      )}>
        <div className="rounded-full bg-white/80 p-1.5 sm:p-2 shadow-lg backdrop-blur-sm group-hover:bg-white/90 transition-all">
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

      {/* Ring animation on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl border-2 border-[var(--accent-primary)] transition-all duration-500",
        isHovering ? "animate-pulse border-white/50" : ""
      )} />
    </button>
  );
}
