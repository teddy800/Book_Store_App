'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Twitter, Instagram, Facebook } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setEmail('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="bg-muted py-12 mt-16"
    >
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & Desc */}
        <div className="text-center md:text-left">
          <h3 className="text-2xl font-bold mb-4">BookWise Pro</h3>
          <p className="text-muted-foreground">Your gateway to astonishing reads.</p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <ul className="space-y-2">
            <li><Link href="/about" className="hover:text-primary">About</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="font-semibold mb-4">Follow Us</h4>
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm"><Twitter className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Instagram className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm"><Facebook className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Subscriber Form */}
        <div>
          <h4 className="font-semibold mb-4">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-4">Get weekly book recs!</p>
          <form onSubmit={handleSubscribe} className="space-y-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={submitted}>
              {submitted ? <Mail className="h-4 w-4 animate-spin" /> : 'Subscribe'}
            </Button>
            {submitted && <p className="text-sm text-green-600">Subscribed! 🎉</p>}
          </form>
        </div>
      </div>
      <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
        <p>&copy; 2025 BookWise Pro. Independent Book Lovers Since Day 1.</p>
      </div>
    </motion.footer>
  );
}