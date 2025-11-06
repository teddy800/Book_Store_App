'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { books } from '@/lib/books';  // Pick first 3 as featured

const Typewriter = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text]);

  return <span>{displayedText}</span>;
};

export default function Hero() {
  const [featuredBook, setFeaturedBook] = useState(books[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedBook(books[Math.floor(Math.random() * 3)]);  // Rotate featured
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary overflow-hidden">
      <motion.div
        animate={{ x: [-20, 20, -20] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute inset-0 bg-black/20"  // Parallax overlay
      />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-6xl md:text-7xl font-bold text-background mb-4"
        >
          Discover <Typewriter text="Extraordinary Worlds" />
        </motion.h1>
        <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
          Dive into {featuredBook.title} – {featuredBook.description?.slice(0, 100)}...
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-background text-primary hover:bg-background/90">
            <a href="/books">Browse Now</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/books">Featured Collection</a>
          </Button>
        </div>
      </div>
    </section>
  );
}