export type AstrologerStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface JyotishTaxConfig {
  id: number;
  gstPercent: number;
  updatedAt?: string;
  updatedBy?: number | string;
}

export interface Astrologer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  specializations: string[];
  languages: string[];
  experience: number;
  rating: number;
  totalConsultations: number;
  pricePerMinute: number;
  isOnline: boolean;
  isVerified: boolean;
  isActive: boolean;
  gallery?: string[];
  documents?: string[];
  status: AstrologerStatus;
  commissionPercent?: number;
  approvedAt?: string;
  approvedBy?: number | string;
  rejectionReason?: string;
  freeOfferActive?: boolean;
  freeOfferMessage?: string;
  freeSessionsRemaining?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession {
  id: number;
  userId: number;
  astrologerId: number;
  user?: { id: number; name: string; avatar?: string };
  astrologer?: { id: number; name: string; avatar?: string };
  status: "ACTIVE" | "ENDED" | "PENDING";
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  totalAmount?: number;
  grossAmount?: number;
  gstPercent?: number;
  gstAmount?: number;
  commissionPercent?: number;
  commissionAmount?: number;
  astrologerAmount?: number;
  platformAmount?: number;
  messages?: ChatMessage[];
  isFree?: boolean;
  freeOfferSource?: "ASTROLOGER" | "ADMIN";
  freeOfferId?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  senderId: number;
  senderType: "USER" | "ASTROLOGER";
  content: string;
  type: "TEXT" | "IMAGE" | "SYSTEM";
  createdAt: string;
}

export interface AdCampaign {
  id: number;
  title: string;
  price: number;
  capacity: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileEditRequest {
  id: number;
  astrologerId: number;
  astrologer?: Astrologer;
  changes: Record<string, unknown>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: number;
  reviewNote?: string;
  createdAt: string;
}

export interface JyotishService {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  isActive: boolean;
}

export interface JyotishSlot {
  id: number;
  astrologerId: number;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export interface FreeConsultationOffer {
  id: number;
  title: string;
  description?: string;
  astrologerAmount: number;
  adminAmount: number;
  sessionsCap: number;
  sessionsUsed: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}
