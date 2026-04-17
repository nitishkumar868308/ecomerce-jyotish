export interface Review {
  id: number;
  productId: string | number;
  userId: number;
  user?: { id: number; name: string; avatar?: string };
  product?: { id: number; name: string };
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isApproved: boolean;
  createdAt: string;
}
