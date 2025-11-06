// lib/types.ts
export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  stock: boolean;
  description: string;
  reviews: number;
}