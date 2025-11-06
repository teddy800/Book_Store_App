'use client';

import { useState, useEffect } from 'react';  // ✅ Added useEffect for mount detection
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Heart, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/lib/cartStore';
import { useWishlistStore } from '@/lib/wishlistStore';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Header() {
  const router = useRouter();
  const { items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);  // ✅ New state: Detect client mount to avoid hydration mismatch

  // ✅ useEffect: Set mounted after first render on client; skips server mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlistItems.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/books?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // ✅ Fallback: Render neutral icon (e.g., Moon) during SSR; client overrides after mount
  if (!mounted) {
    return (
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo & Nav (unchanged) */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              📚 Teddy BookWise 
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/" className="hover:text-primary transition">Home</Link>
              <Link href="/books" className="hover:text-primary transition">Browse</Link>
              <Link href="/wishlist" className="hover:text-primary transition">Wishlist</Link>
            </nav>
          </div>

          {/* Global Search (unchanged) */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 hidden lg:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="search"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </form>

          {/* Actions: Fallback theme button */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1">{wishlistCount}</span>}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1">{cartCount}</span>}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Moon className="h-5 w-5" />  {/* ✅ Fallback: Always Moon on SSR */}
            </Button>
            <Button>Sign In</Button>
          </div>
        </div>
      </motion.header>
    );
  }

  // ✅ Client-mounted render: Full conditional theme toggle
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b shadow-sm"
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo & Nav */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            📚 BookWise Pro
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="hover:text-primary transition">Home</Link>
            <Link href="/books" className="hover:text-primary transition">Browse</Link>
            <Link href="/wishlist" className="hover:text-primary transition">Wishlist</Link>
          </nav>
        </div>

        {/* Global Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 hidden lg:flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="search"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1">{wishlistCount}</span>}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && <span className="ml-1 bg-destructive text-destructive-foreground text-xs rounded-full px-1">{cartCount}</span>}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}  {/* ✅ Conditional only on client */}
          </Button>
          <Button>Sign In</Button>
        </div>
      </div>
    </motion.header>
  );
}