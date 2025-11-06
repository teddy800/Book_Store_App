'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import BookCard from '@/components/BookCard';
import { books, categories } from '@/lib/books';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function Books() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const category = searchParams.get('category') || 'All';
  const [selectCategory, setSelectCategory] = useState(category);

  const [displayedBooks, setDisplayedBooks] = useState(8);
  const [hasMore, setHasMore] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectCategory(category);
  }, [category]);

  const handleCategoryChange = (newCategory: string) => {
    setSelectCategory(newCategory);
    router.push(`/books?category=${newCategory === 'All' ? '' : newCategory}`);
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === 'All' || book.category === category)
    );
  }, [search, category, books]);

  const visibleBooks = useMemo(() => {
    return filteredBooks.slice(0, displayedBooks);
  }, [filteredBooks, displayedBooks]);

  // Simplified: No need for lastBookElementRef; observe the loader sentinel directly

  useEffect(() => {
    setDisplayedBooks(8);
    setHasMore(filteredBooks.length > 8);
  }, [filteredBooks.length]);

  useEffect(() => {
    if (displayedBooks >= filteredBooks.length) {
      setHasMore(false);
    }
  }, [displayedBooks, filteredBooks.length]);

  // Fixed IntersectionObserver: Observe only the loader div, with lower threshold for better triggering
  useEffect(() => {
    if (!hasMore) return;  // Early return if no more to load

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore) {
          setDisplayedBooks((prev) => prev + 8);
        }
      },
      { 
        threshold: 0.1,  // ✅ Fixed: Lower threshold (partial visibility triggers load) for reliability on short/tall viewports
        rootMargin: '0px 0px -50px 0px'  // ✅ Added: Preload a bit before fully in view for smoother UX
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, filteredBooks.length]);  // Dependencies ensure re-observe after length changes

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Sync search to URL (optional; remove if not needed for home vs /books consistency)
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    router.push(`/books?${params.toString()}`);
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/50 min-h-screen">
      <div className="container mx-auto px-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-12"
        >
          BookWise Pro  {/* ✅ Matched screenshot title */}
        </motion.h1>

        {/* Controls: Search and Category (consistent across home and /books) */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
          <Input
            placeholder="Search books..."
            value={search}
            onChange={handleSearchChange}
            className="max-w-md"
          />
          <Select value={selectCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {visibleBooks.length > 0 ? (
            visibleBooks.map((book, index) => (
              <motion.div
                key={book.id}  // ✅ Ensure unique key (assumes book.id exists)
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group"  // For hover effects
              >
                <BookCard book={book} />
              </motion.div>
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full text-center text-muted-foreground py-8"
            >
              No books found matching your criteria.
            </motion.p>
          )}
        </div>

        {/* ✅ Fixed Loader: Only show if hasMore; ref attached directly for observation */}
        {hasMore && visibleBooks.length > 0 && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-sm text-muted-foreground">Loading more...</p>  {/* ✅ Added text to match screenshot */}
            </motion.div>
          </div>
        )}

        {/* End of list message */}
        {!hasMore && visibleBooks.length > 0 && filteredBooks.length > 0 && (
          <p className="text-center text-muted-foreground py-8">
            No more books to load. Showing all {filteredBooks.length} results.
          </p>
        )}
      </div>
    </section>
  );
}