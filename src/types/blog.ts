export interface Blog {
  id: number;
  title: string;
  slug: string;
  authorName: string;
  authorImage?: string;
  category: string;
  description: string;
  excerpt?: string;
  image?: string;
  isPublished: boolean;
  active: boolean;
  deleted: boolean;
  views: number;
  readTime?: number;
  createdAt: string;
  updatedAt: string;
}
