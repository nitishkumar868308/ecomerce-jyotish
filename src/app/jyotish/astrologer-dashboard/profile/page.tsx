"use client";

import React from "react";
import Link from "next/link";
import { ProfileEdit } from "@/components/jyotish/dashboard/ProfileEdit";

export default function AstrologerProfileEditPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/jyotish/astrologer-dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="mb-6 text-2xl font-bold">Edit Profile</h1>
      <ProfileEdit />
    </div>
  );
}
