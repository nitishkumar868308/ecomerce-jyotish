"use client";

import { useMemo, useState } from "react";
import DOMPurify from "dompurify";

interface ProductDescriptionProps {
  html: string;
}

export function ProductDescription({ html }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  const sanitized = useMemo(() => {
    if (typeof window === "undefined") return html;
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }, [html]);

  const isLong = html.length > 300;

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-base font-semibold text-[var(--text-primary)]">
        Description
      </h2>
      <div
        className={
          isLong && !expanded
            ? "relative max-h-40 overflow-hidden text-sm text-[var(--text-secondary)] lg:max-h-none lg:overflow-visible"
            : "text-sm text-[var(--text-secondary)]"
        }
      >
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
        {isLong && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--bg-primary)] to-transparent lg:hidden" />
        )}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-2 text-sm font-medium text-[var(--accent-primary)] hover:underline lg:hidden"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </section>
  );
}
