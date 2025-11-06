'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  { text: 'Amazing selection and fast delivery!', author: 'Jane D.' },
  { text: 'Best prices on hidden gems—love it!', author: 'John S.' },
  { text: 'Family-run vibe with pro service.', author: 'Emily R.' },
  { text: 'Bundles are a steal!', author: 'Mike T.' },
];

export default function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrent((prev) => (prev + 1) % testimonials.length), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8">What Our Readers Say</h2>
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg"
        >
          <p className="text-lg italic mb-4">"{testimonials[current].text}"</p>
          <p className="font-semibold">- {testimonials[current].author}</p>
        </motion.div>
      </div>
    </section>
  );
}