"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
});

export function ProgressBar() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      NProgress.start();
      // Complete after a short delay to allow the page to render
      const timer = setTimeout(() => {
        NProgress.done();
      }, 300);
      previousPathname.current = pathname;
      return () => {
        clearTimeout(timer);
        NProgress.done();
      };
    }
  }, [pathname]);

  return (
    <style jsx global>{`
      #nprogress .bar {
        background: var(--accent-primary) !important;
        height: 3px !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px var(--accent-primary), 0 0 5px var(--accent-primary) !important;
      }
    `}</style>
  );
}

export default ProgressBar;
