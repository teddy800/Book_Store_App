'use client';

import { useState } from 'react';  // ✅ Added: Missing import for useState hook
import Link from 'next/link';  // ✅ Added: For <Link> in empty state CTA
import { useWishlistStore } from '@/lib/wishlistStore';
import BookCard from '@/components/BookCard';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';  // For loading spinner
import jsPDF from 'jspdf';  // ✅ Now resolves after npm i jspdf

export default function Wishlist() {
  const { items, removeItem } = useWishlistStore();
  const [isExporting, setIsExporting] = useState(false);  // ✅ Now defined

  const exportToPDF = async () => {
    if (items.length === 0) return;  // Safety check

    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPos = 20;

      doc.setFontSize(16);
      doc.text('My Wishlist', 20, yPos);
      yPos += 20;

      items.forEach((book) => {
        doc.setFontSize(12);
        doc.text(`${book.title} by ${book.author} - $${book.price.toFixed(2)}`, 20, yPos);
        yPos += 10;
        if (yPos > 280) {  // New page if too long
          doc.addPage();
          yPos = 20;
        }
      });

      doc.save('wishlist.pdf');
    } catch (error) {
      console.error('PDF Export Failed:', error);
      // Optional: Use toast from sonner: toast.error('Export failed!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="py-16 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold"
          >
            Your Wishlist ({items.length})
          </motion.h1>
          {items.length > 0 && (
            <Button onClick={exportToPDF} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export to PDF'
              )}
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <p className="text-xl text-muted-foreground mb-4">Your wishlist is empty.</p>
            <Button asChild>
              <Link href="/books">Start Adding Books!</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="flex flex-col"
              >
                <BookCard book={book} />
                <Button
                  variant="destructive"
                  onClick={() => removeItem(book.id)}
                  className="mt-2"
                >
                  Remove from Wishlist
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}