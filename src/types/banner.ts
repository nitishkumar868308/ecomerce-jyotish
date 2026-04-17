export interface Banner {
  id: number;
  text?: string;
  image?: string;
  link?: string;
  platform: string[];
  active: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  countries?: BannerCountry[];
  states?: BannerState[];
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
  active: boolean;
  deleted: number;
  createdAt: string;
  updatedAt: string;
}
