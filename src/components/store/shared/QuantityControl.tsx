"use client";

import React, { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface QuantityControlProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete: () => void;
  maxQuantity?: number;
  disabled?: boolean;
  itemName?: string;
  deleteLoading?: boolean;
  showDelete?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityControl({
  quantity,
  onIncrement,
  onDecrement,
  onDelete,
  maxQuantity,
  disabled,
  itemName,
  deleteLoading,
  showDelete = true,
  size = "md",
  className,
}: QuantityControlProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAtMin = quantity <= 1;
  const isAtMax = maxQuantity ? quantity >= maxQuantity : false;

  const handleMinusClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isAtMin) {
      if (showDelete) setShowDeleteModal(true);
    } else {
      onDecrement();
    }
  };

  const handlePlusClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onIncrement();
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  const btnSize = size === "sm" ? "min-h-8 w-9" : "min-h-11 w-14";
  const qtySize = size === "sm" ? "min-h-8 w-9 text-sm" : "min-h-11 w-14 text-base";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <>
      <div
        className={cn(
          "inline-flex items-stretch overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]",
          disabled && "pointer-events-none opacity-50",
          className
        )}
      >
        <button
          type="button"
          onClick={handleMinusClick}
          disabled={disabled || (isAtMin && !showDelete)}
          className={cn(
            "flex items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-40",
            btnSize
          )}
          aria-label={isAtMin && showDelete ? "Remove item" : "Decrease quantity"}
        >
          {isAtMin && showDelete ? (
            <Trash2 className={cn(iconSize, "text-[var(--accent-danger)]")} />
          ) : (
            <Minus className={iconSize} />
          )}
        </button>
        <span
          className={cn(
            "flex items-center justify-center border-x border-[var(--border-primary)] bg-[var(--bg-primary)] font-semibold text-[var(--text-primary)]",
            qtySize
          )}
        >
          {quantity}
        </span>
        <button
          type="button"
          onClick={handlePlusClick}
          disabled={disabled || isAtMax}
          className={cn(
            "flex items-center justify-center text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-40",
            btnSize
          )}
          aria-label="Increase quantity"
        >
          <Plus className={iconSize} />
        </button>
      </div>

      {showDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          itemName={itemName}
          loading={deleteLoading}
        />
      )}
    </>
  );
}
