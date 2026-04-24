"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader } from "@/components/ui/Loader";
import { useUIStore } from "@/stores/useUIStore";

/**
 * Full-page mystical Loader driven by `useUIStore.transitionMessage`.
 * Sits mounted in both the jyotish shopper layout and the astrologer
 * dashboard layout so any caller (popup accept, connecting-modal
 * redirect, end-chat confirm) can flash a big centered spinner during
 * the slow transition moments — nothing on the page updates until the
 * server + router catch up, and without this overlay users feel like
 * their click did nothing.
 *
 * The transition message is normally auto-cleared by the destination
 * page's mount effect. Two safety nets guard against an orphaned
 * overlay: (1) a 6s watchdog after `message` is set, and (2) a
 * pathname-change effect — either way the user always escapes.
 */
export function TransitionOverlay() {
  const message = useUIStore((s) => s.transitionMessage);
  const endTransition = useUIStore((s) => s.endTransition);
  const pathname = usePathname();

  // Watchdog: if a destination page forgets to clear (e.g. network
  // error, mount failure), the spinner can't hold the UI hostage.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => endTransition(), 6000);
    return () => clearTimeout(t);
  }, [message, endTransition]);

  // Clear on route change too — once the new page has mounted we've
  // already crossed the moment that needed the bridge; the destination
  // will replace with its own loaders if it still needs them.
  useEffect(() => {
    endTransition();
    // Intentionally only on pathname change (NOT on endTransition
    // identity) so we don't loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!message) return null;
  return <Loader variant="fullpage" message={message} />;
}

export default TransitionOverlay;
