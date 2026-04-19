"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useProducts } from "@/services/products";
import { filterByPlatform } from "@/lib/products";
import { ProductCard } from "@/components/store/product/ProductCard";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SearchModal({ isOpen, onClose, className }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const isMobile = useIsMobile();

  const { data, isLoading } = useProducts(
    query.length >= 2 ? { search: query, limit: 12 } : undefined
  );

  const products = filterByPlatform(data?.data, "wizard");
  const hasSearched = query.length >= 2;

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[var(--bg-overlay)]"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1 }}
            exit={isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 overflow-hidden bg-[var(--bg-card)] shadow-2xl",
              isMobile
                ? "inset-0"
                : "inset-x-4 top-[10vh] mx-auto max-h-[80vh] max-w-3xl rounded-xl sm:inset-x-auto sm:w-full",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--border-primary)] px-4 py-3 sm:px-5">
              <SearchInput
                onSearch={handleSearch}
                debounceMs={400}
                placeholder="Search products..."
                fullWidth
                className="flex-1"
                autoFocus
              />
              <button
                onClick={handleClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)]"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[calc(100vh-80px)] overflow-y-auto px-4 py-4 scrollbar-none sm:max-h-[calc(80vh-80px)] sm:px-5">
              {!hasSearched ? (
                <div className="py-12 text-center">
                  <Search className="mx-auto h-10 w-10 text-[var(--text-secondary)]/40" />
                  <p className="mt-3 text-sm text-[var(--text-secondary)]">
                    Start typing to search products
                  </p>
                </div>
              ) : isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]"
                    >
                      <Skeleton className="aspect-square w-full rounded-none" height="100%" />
                      <div className="space-y-2 p-3">
                        <Skeleton height={14} width="80%" />
                        <Skeleton height={12} width="50%" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No results found"
                  description={`We couldn't find any products matching "${query}"`}
                />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((product) => (
                    <div key={product.id} onClick={handleClose}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SearchModal;
