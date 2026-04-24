"use client";

import React, { useState } from "react";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import { Skeleton } from "@/components/ui/loader/Skeleton";
import {
  useConsultantServices,
  useConsultantSlots,
  useConsultantDurations,
  useBookConsultant,
} from "@/services/consultant";
import { SlotSelector } from "./SlotSelector";
import { DurationSelector } from "./DurationSelector";
import type { ConsultantService, ConsultantSlot, ConsultantDuration } from "@/types/consultant";

interface BookingFormProps {
  astrologerId?: number;
  className?: string;
}

export function BookingForm({ astrologerId, className }: BookingFormProps) {
  const [serviceId, setServiceId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | undefined>();
  const [selectedDurationId, setSelectedDurationId] = useState<number | undefined>();

  const { data: servicesRaw, isLoading: loadingServices } = useConsultantServices();
  const { data: slotsRaw, isLoading: loadingSlots } = useConsultantSlots(astrologerId);
  const { data: durationsRaw, isLoading: loadingDurations } = useConsultantDurations();
  const bookConsultant = useBookConsultant();

  const services = (servicesRaw as ConsultantService[] | undefined) ?? [];
  const allSlots = (slotsRaw as ConsultantSlot[] | undefined) ?? [];
  const durations = (durationsRaw as ConsultantDuration[] | undefined) ?? [];

  // Filter slots by selected date
  const filteredSlots = date
    ? allSlots.filter((s) => s.date === date)
    : allSlots;

  const serviceOptions = services
    .filter((s) => s.active)
    .map((s) => ({ value: String(s.id), label: s.title }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!astrologerId || !serviceId || !selectedSlotId) return;

    bookConsultant.mutate({
      astrologerId,
      serviceId,
      slotId: selectedSlotId,
      ...(selectedDurationId ? { durationId: selectedDurationId } : {}),
    });
  };

  const isFormValid =
    !!astrologerId && !!serviceId && !!selectedSlotId;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 sm:p-6",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          Book a Consultation
        </h3>
      </div>

      {/* Service selector */}
      <div>
        {loadingServices ? (
          <Skeleton height={42} />
        ) : (
          <Select
            label="Service"
            options={serviceOptions}
            placeholder="Select a service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
          />
        )}
      </div>

      {/* Date picker */}
      <div>
        <DatePicker
          label="Date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedSlotId(undefined);
          }}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>

      {/* Slot selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
          <Clock className="mr-1 inline h-4 w-4" />
          Available Slots
        </label>
        {loadingSlots ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} height={38} className="rounded-lg" />
            ))}
          </div>
        ) : (
          <SlotSelector
            slots={filteredSlots}
            selectedId={selectedSlotId}
            onSelect={setSelectedSlotId}
          />
        )}
      </div>

      {/* Duration selector */}
      {durations.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            Duration
          </label>
          {loadingDurations ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={60} className="rounded-lg" />
              ))}
            </div>
          ) : (
            <DurationSelector
              durations={durations}
              selectedId={selectedDurationId}
              onSelect={setSelectedDurationId}
            />
          )}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        fullWidth
        size="lg"
        loading={bookConsultant.isPending}
        disabled={!isFormValid || bookConsultant.isPending}
      >
        Book Now
      </Button>
    </form>
  );
}

export default BookingForm;
