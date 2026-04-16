"use client";

import { cn } from "@/lib/utils";
import { useCategories } from "@/services/categories";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import { ROUTES } from "@/config/routes";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export function CategoryShowcase() {
  const { data: categories, isLoading } = useCategories();

  const activeCategories = categories?.filter((c) => c.isActive);

  return (
    <section className="py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-8 text-center lg:mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-[var(--text-secondary)]">
            Explore our curated collections
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton variant="circle" width={120} height={120} />
                <Skeleton variant="rectangle" width={80} height={16} />
              </div>
            ))}
          </div>
        )}

        {/* Categories grid */}
        {!isLoading && activeCategories && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-6"
          >
            {activeCategories.map((category) => (
              <motion.div key={category.id} variants={itemVariants}>
                <Link
                  href={ROUTES.CATEGORY(category.slug || String(category.id))}
                  className="group flex flex-col items-center gap-3"
                >
                  {/* Image container */}
                  <div
                    className={cn(
                      "relative h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28 lg:h-32 lg:w-32",
                      "border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)]",
                      "transition-all duration-300",
                      "group-hover:scale-105 group-hover:border-[var(--accent-primary)] group-hover:shadow-lg group-hover:shadow-[var(--accent-primary)]/10"
                    )}
                  >
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[var(--bg-tertiary)]">
                        <span className="text-2xl font-semibold text-[var(--text-tertiary)]">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category name */}
                  <span
                    className={cn(
                      "text-center text-sm font-medium text-[var(--text-primary)]",
                      "transition-colors duration-200 group-hover:text-[var(--accent-primary)]"
                    )}
                  >
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && !activeCategories?.length && (
          <p className="text-center text-[var(--text-tertiary)]">
            No categories available right now.
          </p>
        )}
      </div>
    </section>
  );
}

export default CategoryShowcase;
