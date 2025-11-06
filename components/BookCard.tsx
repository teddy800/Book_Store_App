// Update to BookCard.tsx (if not already clickable) - Add onClick prop
// In components/BookCard.tsx (assuming existing; enhance for modal trigger)
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BookCardProps {
  book: {
    id: number;
    title: string;
    author: string;
    price: number;
    image: string;
    rating: number;
    reviews: number;
    stock: boolean;
    category: string;
  };
  onClick?: () => void;  // NEW: Prop for modal trigger
}

export default function BookCard({ book, onClick }: BookCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden cursor-pointer"
      onClick={onClick}  // NEW: Trigger modal
    >
      <img src={book.image} alt={book.title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <Badge variant="secondary" className="mb-2">{book.category}</Badge>
        <h3 className="font-bold text-lg mb-1">{book.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">By {book.author}</p>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.floor(book.rating) ? 'fill-amber-500 text-amber-500' : 'text-gray-300'}`} />
            ))}
            <span className="text-sm text-muted-foreground ml-1">({book.reviews})</span>
          </div>
          <span className="text-xl font-bold">${book.price}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={book.stock ? "default" : "destructive"}>{book.stock ? 'In Stock' : 'Out of Stock'}</Badge>
          <Button size="sm" className="ml-auto" disabled={!book.stock}>
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.div>
  );
}