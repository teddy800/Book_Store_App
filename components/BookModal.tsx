// Path: components/BookModal.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { X, Star } from 'lucide-react';
import { useCartStore } from '@/lib/cartStore';
import { Book } from '@/lib/types';

interface Props {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookModal({ book, isOpen, onClose }: Props) {
  const addToCart = useCartStore((state) => state.addItem);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/reviews?bookId=${book.id}`)
        .then(res => res.json())
        .then(setReviews);
    }
  }, [isOpen, book.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ... your original JSX for image, title, etc. */}
          <div className="p-6">
            <h2 className="text-3xl font-bold mb-2">{book.title}</h2>
            <p className="text-xl text-muted-foreground mb-4">by {book.author}</p>
            <p className="text-lg mb-6">{book.description}</p>
            <Button onClick={() => addToCart(book)} className="w-full mb-4">Add to Cart – ${book.price}</Button>
            
            {/* Reviews */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Reviews ({reviews.length})</h3>
              {reviews.map((r: any) => (
                <div key={r.id} className="border-b py-2">
                  <div className="flex items-center mb-1">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-500" />)}
                    <span className="ml-2 text-sm">{r.user.name}</span>
                  </div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}