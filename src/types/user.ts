export type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | "ASTROLOGER";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  profileImage?: string;
  gender?: string;
  countryCode?: string;
  country?: string;
  lastLoginAt?: string | null;
  lastLogin?: string | null;
  loginCount?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressType = "HOME" | "OFFICE" | "OTHER";

export interface Address {
  // Address rows use cuid IDs in the DB, so this is a string.
  id: string;
  userId: number;
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  /** Country phone code (e.g. "+91") remembered with the row so we can drive
   * phone validation consistently if the user later edits. */
  countryCode?: string;
  /** Which bucket the shopper filed this row under. */
  addressType?: AddressType;
  /** Custom label when `addressType === "OTHER"` (e.g. "Parents' place"). */
  addressLabel?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user: User;
  message?: string;
}
