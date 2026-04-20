export interface Blog {
  id: number;
  title: string;
  slug: string;
  authorName?: string;
  author?: string;
  authorImage?: string;
  category?: string;
  tags?: string[];
  /** Long-form HTML body for the blog post. */
  content?: string;
  description?: string;
  /** Short summary shown in blog cards and meta description fallbacks. */
  excerpt?: string;
  shortDescription?: string;
  image?: string;
  thumbnail?: string;
  images?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  isPublished: boolean;
  active: boolean;
  deleted: boolean;
  views?: number;
  readTime?: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
