export interface ConsultantService {
  id: number;
  name: string;
  description?: string;
  image?: string;
  price: number;
  isActive: boolean;
}

export interface ConsultantSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface ConsultantDuration {
  id: number;
  minutes: number;
  label: string;
  price: number;
}

export interface BookingPayload {
  serviceId: number;
  slotId: number;
  durationId: number;
  astrologerId: number;
  notes?: string;
}
