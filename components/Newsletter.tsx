'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';  // Now resolves!
import { showToast } from '@/lib/utils';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {  // Basic validation
      showToast('Subscribed! 10% off code: WELCOME10', 'success');
      setEmail('');
    } else {
      showToast('Please enter a valid email', 'error');
    }
  };

  return (
    <section className="py-16 bg-primary text-primary-foreground" aria-labelledby="newsletter-title">
      <div className="container mx-auto px-4 text-center">
        <h2 id="newsletter-title" className="text-3xl font-bold mb-4">Join Our Newsletter</h2>
        <p className="mb-8 max-w-md mx-auto">Get 10% off your first order + exclusive deals.</p>
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2" role="search">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
            required
          />
          <Button type="submit">Subscribe</Button>
        </form>
      </div>
    </section>
  );
}