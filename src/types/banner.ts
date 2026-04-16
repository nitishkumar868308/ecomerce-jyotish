export interface Banner {
  id: number;
  title?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface HeaderItem {
  id: number;
  title: string;
  subtitle?: string;
  image?: string;
  link?: string;
  type: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface VideoStory {
  id: number;
  title?: string;
  videoUrl: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt: string;
}
