"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface Tab {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "relative flex overflow-x-auto border-b border-[var(--border-primary)] scrollbar-none",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors duration-200 outline-none",
              isActive
                ? "text-[var(--accent-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--accent-primary)] transition-all duration-200" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
