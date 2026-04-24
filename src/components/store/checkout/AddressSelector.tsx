"use client";

import React from "react";
import { MapPin, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Address {
  id: string;
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  [key: string]: any;
}

interface AddressSelectorProps {
  addresses: Address[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  className?: string;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  className,
}: AddressSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {addresses.map((addr) => {
        const isSelected = addr.id === selectedId;
        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelect(addr.id)}
            className={cn(
              "relative w-full rounded-xl border-2 p-4 text-left transition-all duration-200",
              isSelected
                ? "border-[var(--accent-primary)] bg-[var(--accent-primary-light)]/30 shadow-sm"
                : "border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--border-focus)]"
            )}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)]">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-secondary)]"
                )}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {addr.name}
                </p>
                {addr.phone && (
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {addr.phone}
                  </p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                  <br />
                  {addr.city}, {addr.state} - {addr.pincode}
                  {addr.country ? `, ${addr.country}` : ""}
                </p>
              </div>
            </div>
          </button>
        );
      })}

      {/* Add new address */}
      <Button
        variant="outline"
        size="sm"
        onClick={onAddNew}
        leftIcon={<Plus className="h-4 w-4" />}
        fullWidth
      >
        Add New Address
      </Button>
    </div>
  );
}

export default AddressSelector;
