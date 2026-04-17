"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)] p-6 sm:p-10 lg:p-16">
          {/* Decorative */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-white/5" />

          <div className="relative flex flex-col items-center text-center lg:flex-row lg:text-left lg:justify-between gap-6">
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white mb-4">
                <Mail className="h-4 w-4" />
                Newsletter
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white lg:text-3xl">
                Stay Updated with Our Latest
              </h2>
              <p className="mt-1.5 text-sm sm:text-base text-white/80">
                Subscribe to get exclusive offers, new product alerts, and spiritual insights
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-md gap-2 lg:w-auto"
            >
              {submitted ? (
                <div className="flex items-center gap-2 rounded-xl bg-white/20 px-6 py-3 text-white">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Thank you for subscribing!</span>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-[var(--accent-primary)] hover:bg-white/90 transition-colors flex items-center gap-2"
                  >
                    Subscribe
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
