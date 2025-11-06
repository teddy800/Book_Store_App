'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import BookCard from '@/components/BookCard';
import { books } from '@/lib/books';
import { useWishlistStore } from '@/lib/wishlistStore';  // Track "viewed" via wishlist

export default function Recommendations() {
  const { items } = useWishlistStore();
  const viewedCategories = useMemo(() => [...new Set(items.map((b) => b.category))], [items]);

  const recommended = useMemo(() => {
    // "AI" logic: Filter high-rating books from viewed categories
    return books
      .filter((b) => viewedCategories.includes(b.category) && b.rating > 4)
      .slice(0, 4);  // Top 4
  }, [viewedCategories]);

  if (recommended.length === 0) return null;

  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center">🧠 You Might Like (AI Picks)</h2>
        <div className="flex overflow-x-auto space-x-4 pb-4 snap-x snap-mandatory">
          {recommended.map((book, index) => (
            <motion.div
              key={book.id}
              className="snap-center flex-shrink-0 w-64"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <BookCard book={book} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}