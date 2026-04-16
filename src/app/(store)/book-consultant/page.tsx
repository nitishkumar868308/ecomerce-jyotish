"use client";

import { useState } from "react";
import DefaultPage from "@/components/layout/DefaultPage";
import { PageHeader } from "@/components/shared/PageHeader";
import ServiceList from "@/components/store/consultant/ServiceList";
import BookingForm from "@/components/store/consultant/BookingForm";
import { Modal } from "@/components/ui/Modal";
import { useConsultantServices } from "@/services/consultant";

export default function BookConsultantPage() {
  const { data: services, isLoading } = useConsultantServices();
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleBookNow(service: any) {
    setSelectedService(service);
    setIsModalOpen(true);
  }

  function handleClose() {
    setIsModalOpen(false);
    setSelectedService(null);
  }

  return (
    <DefaultPage>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Book a Consultant"
          description="Choose a service and book your session with our expert consultants"
        />

        <div className="mt-8">
          <ServiceList
            services={services ?? []}
            loading={isLoading}
            onBookNow={handleBookNow}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={`Book: ${selectedService?.name ?? "Service"}`}
      >
        {selectedService && (
          <BookingForm service={selectedService} onSuccess={handleClose} />
        )}
      </Modal>
    </DefaultPage>
  );
}
