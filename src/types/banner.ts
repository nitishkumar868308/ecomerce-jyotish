export interface Banner {
  id: number;
  text?: string | null;
  image?: string | null;
  link?: string | null;
  platform: string[];
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  countries?: BannerCountry[];
  states?: BannerState[];
}

export interface BannerCountryInput {
  countryCode: string;
  position: number;
}

export interface BannerStateInput {
  stateId: number;
  position: number;
}

export interface BannerCountry {
  id: number;
  bannerId: number;
  countryCode: string;
  position: number;
}

export interface BannerState {
  id: number;
  bannerId: number;
  stateId: number;
  position: number;
}

export interface HeaderItem {
  id: number;
  name: string;
  active: boolean;
  deleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoStory {
  id: number;
  title: string;
  url: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  thumbnail?: string;
  description?: string;
  isActive?: boolean;
  active: boolean;
  deleted: number;
  createdAt: string;
  updatedAt: string;
}
