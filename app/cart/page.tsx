'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Trash2, Minus, Plus, CreditCard, Package, Zap, Heart, Save, Percent, Truck, Lock, CheckCircle, XCircle, Loader2, ShoppingBag, Gift, MapPin, Phone, User, Mail, Calendar, Clock, Globe, DollarSign, Euro, Pound, Yen, Bitcoin, AlertTriangle, Shield, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// International Cart Item Type with full properties
interface CartItem {
  id: number;
  book: {
    id: number;
    title: string;
    author: string;
    price: number;
    image: string;
    category: string;
    isbn?: string;
    publisher?: string;
    publishDate?: string;
    weight?: number;
    dimensions?: string;
  };
  quantity: number;
  subtotal: number;
  wishlist?: boolean;
  addedDate?: Date;
  stockAvailable?: boolean;
  selected?: boolean;
}

// Discount Code Interface
interface DiscountCode {
  code: string;
  percentage: number;
  minAmount: number;
  maxUses: number;
  usesLeft: number;
  expiryDate: Date;
  description: string;
  applicableCurrencies: string[];
  regions: string[];
}

// Currency and Locale Support
const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.81 },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', rate: 55.0 },
  { code: 'BTC', symbol: '₿', name: 'Bitcoin', rate: 0.000018 },
];

const TAX_RATES = {
  US: 0.08,
  EU: 0.21,
  UK: 0.20,
  ET: 0.15,
};

// Shipping Rates
const SHIPPING_RATES = {
  US: { base: 5.99, perKg: 2.5 },
  EU: { base: 8.99, perKg: 3.0 },
  UK: { base: 7.99, perKg: 2.8 },
  ET: { base: 4.99, perKg: 1.5 },
  freeThreshold: 50,
};

// Stripe Promise
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');

// Custom hook for localStorage cart with real-time multi-tab sync via BroadcastChannel
function useGuestCartStorage(key: string, initialValue: CartItem[]) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const channel = useRef(new BroadcastChannel('guest-cart'));

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        const now = new Date().getTime();
        const validItems = parsed.filter((item: CartItem) => {
          if (item.addedDate) {
            const addedTime = new Date(item.addedDate).getTime();
            return (now - addedTime) < 30 * 24 * 60 * 60 * 1000;
          }
          return true;
        });
        if (parsed.length !== validItems.length) {
          toast.warning(`Expired ${parsed.length - validItems.length} item(s) cleared.`);
        }
        window.localStorage.setItem(key, JSON.stringify(validItems));
        setStoredValue(validItems);
      }
    } catch (error) {
      console.error('LocalStorage error:', error);
      toast.error('Cart load failed - starting fresh');
    }
  }, [key]);

  useEffect(() => {
    const handleMessage = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) setStoredValue(JSON.parse(item));
      } catch (error) {
        console.error('Broadcast sync error:', error);
      }
    };
    channel.current.addEventListener('message', handleMessage);
    return () => channel.current.removeEventListener('message', handleMessage);
  }, [key]);

  const setValue = useCallback((value: CartItem[]) => {
    try {
      const validValue = value.filter(item => item.quantity > 0 && item.book.price > 0);
      setStoredValue(validValue);
      window.localStorage.setItem(key, JSON.stringify(validValue));
      channel.current.postMessage({ type: 'update', key });
      if (value.length !== validValue.length) {
        toast.warning('Invalid items cleared from cart.');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Cart save failed - storage quota?');
    }
  }, [key]);

  const clear = useCallback(() => {
    setStoredValue([]);
    window.localStorage.removeItem(key);
    channel.current.postMessage({ type: 'clear', key });
    toast.success('Cart cleared completely.');
  }, [key]);

  const removeItemById = useCallback((id: number) => {
    const newValue = storedValue.filter(item => item.id !== id);
    setValue(newValue);
  }, [storedValue, setValue]);

  return [storedValue, setValue, clear, removeItemById] as const;
}

// Discount Validation
const validateDiscount = (code: string, subtotal: number, currency: string, country: string): { valid: boolean; percentage: number; error?: string } => {
  const codes: DiscountCode[] = [
    { code: 'WELCOME10', percentage: 10, minAmount: 20, maxUses: 1000, usesLeft: 950, expiryDate: new Date('2026-12-31'), description: 'Welcome discount', applicableCurrencies: ['USD', 'EUR'], regions: ['all'] },
    { code: 'BOOKLOVER', percentage: 15, minAmount: 50, maxUses: 500, usesLeft: 420, expiryDate: new Date('2025-12-31'), description: 'Book lovers special', applicableCurrencies: ['USD', 'GBP'], regions: ['all'] },
    { code: 'CYBER20', percentage: 20, minAmount: 100, maxUses: 200, usesLeft: 150, expiryDate: new Date('2025-11-30'), description: 'Cyber Monday', applicableCurrencies: ['USD', 'EUR', 'BTC'], regions: ['all'] },
    { code: 'ETB5OFF', percentage: 5, minAmount: 1000, maxUses: 300, usesLeft: 280, expiryDate: new Date('2025-12-31'), description: 'Ethiopian special', applicableCurrencies: ['ETB'], regions: ['ET'] },
  ];

  const currentCode = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
  if (!currentCode) return { valid: false, percentage: 0, error: 'Invalid discount code' };
  if (currentCode.usesLeft <= 0) return { valid: false, percentage: 0, error: 'Code exhausted' };
  if (new Date() > currentCode.expiryDate) return { valid: false, percentage: 0, error: 'Code expired' };
  if (!currentCode.applicableCurrencies.includes(currency)) return { valid: false, percentage: 0, error: 'Code not valid for this currency' };
  if (!currentCode.regions.includes(country) && currentCode.regions[0] !== 'all') return { valid: false, percentage: 0, error: 'Code not valid in your region' };
  const adjustedMin = currentCode.minAmount * (SUPPORTED_CURRENCIES.find(c => c.code === currency)?.rate || 1);
  if (subtotal < adjustedMin) return { valid: false, percentage: 0, error: `Minimum ${adjustedMin.toFixed(2)} ${currency} required` };

  return { valid: true, percentage: currentCode.percentage };
};

// Shipping Calculation
const calculateShipping = (subtotal: number, weight: number, country: string, currency: string) => {
  const rates = SHIPPING_RATES[country as keyof typeof SHIPPING_RATES] || SHIPPING_RATES.US;
  let cost = rates.base + (weight * rates.perKg);
  if (subtotal > rates.freeThreshold) cost = 0;
  const rate = SUPPORTED_CURRENCIES.find(c => c.code === currency)?.rate || 1;
  return cost * rate;
};

// Tax Calculation
const calculateTax = (subtotal: number, country: string) => {
  const rate = TAX_RATES[country as keyof typeof TAX_RATES] || 0.15;
  return subtotal * rate;
};

// Stripe Checkout Component
function CheckoutForm({ total, currency, country, onSuccess }: { total: number; currency: string; country: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      toast.error('Payment processor not loaded');
      return;
    }

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement)!,
    });

    if (error) {
      toast.error(error.message || 'Payment declined');
      return;
    }

    if (paymentMethod) {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: total * 100,
            currency,
            country,
            paymentMethodId: paymentMethod.id,
            address,
          }),
        });
        if (response.ok) {
          const { clientSecret } = await response.json();
          const { error: confirmError } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: paymentMethod.id,
          });
          if (!confirmError) {
            toast.success('Payment confirmed! Order ID: #12345');
            onSuccess();
          } else {
            toast.error(confirmError.message || 'Confirmation failed');
          }
        } else {
          toast.error('Server error during payment');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast.error('Network error - please retry');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement 
        options={{ 
          style: { 
            base: { 
              color: 'white', 
              fontSize: '16px',
              '::placeholder': { color: '#9ca3af' },
              backgroundColor: 'transparent',
              border: '1px solid #f59e0b'
            } 
          } 
        }} 
      />
      <Button type="submit" disabled={!stripe || !elements} className="w-full bg-green-600 hover:bg-green-700 text-white">
        <Lock className="h-4 w-4 mr-2" />
        Pay {currency} {total.toFixed(2)}
      </Button>
    </form>
  );
}

// Main Cart Component - Advanced International Professional Cart with Real-Time Syncing
export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [localCart, setLocalCart, clearLocalCart, removeLocalItemById] = useGuestCartStorage('guest-cart', []);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('ET');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [taxRate, setTaxRate] = useState(0.15);
  const [currency, setCurrency] = useState('ETB');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [giftWrap, setGiftWrap] = useState(false);
  const [expressShipping, setExpressShipping] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newsletterSubscribe, setNewsletterSubscribe] = useState(false);
  const [savePaymentInfo, setSavePaymentInfo] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderId, setOrderId] = useState('ORD-' + Date.now().toString().slice(-6));

  const { data: session } = useSession();

  // Memoized values
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.subtotal, 0), [cartItems]);
  const discounted = useMemo(() => subtotal * (1 - discount / 100), [subtotal, discount]);
  const tax = useMemo(() => calculateTax(discounted, country), [discounted, country]);
  const totalWeight = useMemo(() => cartItems.reduce((sum, item) => sum + (item.book.weight || 0.5) * item.quantity, 0), [cartItems]);
  const shipping = useMemo(() => calculateShipping(subtotal, totalWeight, country, currency), [subtotal, totalWeight, country, currency]);
  const total = useMemo(() => discounted + tax + shipping, [discounted, tax, shipping]);

  // Sync cartItems with localCart for guests
  useEffect(() => {
    if (!session?.user?.id) {
      setCartItems(localCart);
    }
  }, [localCart, session]);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    if (session?.user?.name) {
      setPhone(session.user.name || '');
    }
    if (session?.user?.id) {
      fetchCart();
    } else {
      setCartItems(localCart);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const newTax = TAX_RATES[country as keyof typeof TAX_RATES] || 0.15;
    setTaxRate(newTax);
  }, [country]);

  // Real-time syncing: Silent polling for authenticated users every 5 seconds
  const silentFetchCart = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const { cart } = await res.json();
        const items = cart?.items?.map(item => ({
          ...item,
          subtotal: item.quantity * item.book.price,
          addedDate: new Date(item.addedDate),
        })) || [];
        setCartItems(items);
      }
    } catch (error) {
      console.error('Silent fetch error:', error);
    }
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;

    silentFetchCart();
    const interval = setInterval(silentFetchCart, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [session, silentFetchCart]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const { cart } = await res.json();
        const items = cart?.items?.map(item => ({
          ...item,
          subtotal: item.quantity * item.book.price,
          addedDate: new Date(item.addedDate),
        })) || [];
        setCartItems(items);
        if (localCart.length > 0) {
          localCart.forEach(item => addToCart(item.book.id, item.quantity));
          clearLocalCart();
        }
      } else {
        toast.error('Cart fetch failed - retrying in 5s');
        setTimeout(fetchCart, 5000);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Offline mode - using cached cart');
      setCartItems(localCart);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (bookId: number, qty = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, quantity: qty }),
      });
      if (res.ok) {
        toast.success('Item added successfully!');
        fetchCart();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Stock unavailable');
      }
    } catch (error) {
      console.error('Add error:', error);
      if (!session?.user?.id) {
        // Guest mode: Fetch book details and add to local cart
        try {
          const bookRes = await fetch(`/api/books/${bookId}`);
          if (bookRes.ok) {
            const book = await bookRes.json();
            const newItem: CartItem = {
              id: Date.now() + Math.random(),
              book,
              quantity: qty,
              subtotal: book.price * qty,
              addedDate: new Date(),
            };
            const newLocal = [...localCart, newItem];
            setLocalCart(newLocal);
            toast.success('Added to cart locally');
          } else {
            toast.error('Failed to fetch book details');
          }
        } catch (bookError) {
          console.error('Book fetch error:', bookError);
          toast.error('Connection error - item not added');
        }
      } else {
        toast.error('Connection error - item not added');
      }
    }
  };

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return removeItem(itemId);
    setUpdating(true);
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: itemId, quantity: newQty }),
      });
      if (res.ok) {
        fetchCart();
        toast.success('Quantity updated');
      } else {
        toast.error('Update failed - stock limit');
      }
    } catch (error) {
      console.error('Update error:', error);
      if (!session?.user?.id) {
        // Guest mode: Update local
        const newItems = localCart.map(i => i.book.id === itemId ? { ...i, quantity: newQty, subtotal: newQty * i.book.price } : i);
        setLocalCart(newItems);
        toast.success('Quantity updated locally');
      } else {
        toast.error('Updated cached locally');
        const newItems = cartItems.map(i => i.book.id === itemId ? { ...i, quantity: newQty, subtotal: newQty * i.book.price } : i);
        setCartItems(newItems);
      }
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm('Remove this item?')) return;
    try {
      const res = await fetch(`/api/cart?bookId=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCart();
        toast.success('Item removed');
      } else {
        toast.error('Removal failed');
      }
    } catch (error) {
      console.error('Remove error:', error);
      if (!session?.user?.id) {
        // Guest mode: Remove local
        const newLocal = localCart.filter(i => i.book.id !== itemId);
        setLocalCart(newLocal);
        toast.success('Item removed locally');
      } else {
        toast.error('Removed locally');
        const newItems = cartItems.filter(i => i.book.id !== itemId);
        setCartItems(newItems);
      }
    }
  };

  const toggleWishlist = async (itemId: number) => {
    const item = cartItems.find(i => i.book.id === itemId);
    if (!item) return;
    const newItems = cartItems.map(i =>
      i.book.id === itemId ? { ...i, wishlist: !i.wishlist } : i
    );
    setCartItems(newItems);
    toast.success(item.wishlist ? 'Moved to wishlist' : 'Removed from wishlist');
  };

  const applyDiscount = async () => {
    const validation = validateDiscount(discountCode, subtotal, currency, country);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid code');
      return;
    }
    setDiscount(validation.percentage);
    toast.success(`Discount ${validation.percentage}% activated!`);
  };

  const handleCheckout = async () => {
    if (!address || !city || !postalCode || !termsAccepted) {
      toast.error('Please complete all required fields and accept terms');
      return;
    }
    if (paymentMethod === 'card') {
      toast.info('Processing secure payment...');
      setTimeout(async () => {
        toast.success('Order confirmed! Tracking #ET-12345');
        if (session) {
          await fetch('/api/cart', { method: 'DELETE' });
        } else {
          clearLocalCart();
        }
        setCartItems([]);
      }, 2000);
    } else if (paymentMethod === 'crypto') {
      toast.info('Redirecting to crypto gateway...');
      setTimeout(async () => {
        toast.success('Crypto payment confirmed!');
        if (session) {
          await fetch('/api/cart', { method: 'DELETE' });
        } else {
          clearLocalCart();
        }
        setCartItems([]);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <section className="py-16 min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-950 via-rose-950 to-slate-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-amber-400" />
          <p className="text-amber-300">Syncing your collection...</p>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 bg-gradient-to-b from-amber-950 via-rose-950 to-slate-950 min-h-screen">
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-5xl font-bold text-center mb-12 text-white"
      >
        Your Literary Collection
      </motion.h1>

      {cartItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 text-white"
        >
          <BookOpen className="h-24 w-24 mx-auto mb-6 text-amber-400 animate-pulse" />
          <h3 className="text-3xl font-bold mb-4">Cart Synced Empty</h3>
          <p className="text-xl text-amber-300 mb-8">Load up on data streams from the book grid.</p>
          <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-xl px-8 py-4">
            <a href="/books">
              Discover Books
            </a>
          </Button>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items Grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex gap-2 mb-6">
              <Checkbox id="select-all" onCheckedChange={(checked) => setCartItems(prev => prev.map(item => ({ ...item, selected: checked }))) } />
              <Label htmlFor="select-all" className="text-white">Select All</Label>
              <Button variant="outline" size="sm" onClick={() => {
                const selected = cartItems.filter(item => item.selected);
                if (selected.length > 0) {
                  selected.forEach(item => removeItem(item.id));
                }
              }} disabled={cartItems.filter(item => item.selected).length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
            <AnimatePresence>
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 relative"
                >
                  <Checkbox 
                    className="absolute top-4 left-4"
                    checked={item.selected}
                    onCheckedChange={(checked) => setCartItems(prev => prev.map(i => i.id === item.id ? { ...i, selected: checked } : i))}
                  />
                  <div className="flex items-start gap-6">
                    <img 
                      src={item.book.image} 
                      alt={item.book.title} 
                      className="w-28 h-40 object-cover rounded-xl flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-xl text-white truncate pr-4">{item.book.title}</h3>
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-300 border-amber-500/30 ml-2 flex-shrink-0">
                          {item.book.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-amber-300 mb-3 truncate">By {item.book.author}</p>
                      <p className="text-xs text-muted-foreground mb-1">Publisher: {item.book.publisher || 'Independent'}</p>
                      <p className="text-xs text-muted-foreground mb-4">ISBN: {item.book.isbn || 'N/A'}</p>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-lg font-bold text-amber-300">${item.book.price}</p>
                        <p className="text-xs text-muted-foreground">Weight: {item.book.weight || 0.5}kg</p>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateQuantity(item.book.id, item.quantity - 1)} 
                          disabled={updating || item.quantity <= 1}
                          className="border-amber-500 text-amber-400 hover:bg-amber-500/10 h-10 w-10 p-0 rounded-lg"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.book.id, parseInt(e.target.value) || 1)}
                          className="w-20 text-center bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500 h-10"
                          min="1"
                          disabled={updating}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateQuantity(item.book.id, item.quantity + 1)} 
                          disabled={updating}
                          className="border-amber-500 text-amber-400 hover:bg-amber-500/10 h-10 w-10 p-0 rounded-lg"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 ml-auto">
                      <p className="font-bold text-xl text-amber-300">${item.subtotal.toFixed(2)}</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleWishlist(item.book.id)} 
                          className="text-amber-400 hover:text-amber-300 p-2 h-auto w-auto"
                          aria-label={item.wishlist ? 'Removed from wishlist' : 'Added to wishlist'}
                        >
                          {item.wishlist ? <Save className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeItem(item.book.id)} 
                          className="text-red-400 hover:text-red-300 p-2 h-auto w-auto"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4 bg-amber-500/20" />
                  <div className="flex items-center justify-between text-sm text-amber-300">
                    <span>Added: {item.addedDate ? item.addedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Today'}</span>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                      {item.stockAvailable ? 'In Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="mt-8 p-4 bg-white/5 rounded-xl">
              <h4 className="text-white font-semibold mb-4">Cart Actions</h4>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setCartItems([])} className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button onClick={() => toast.info('Wishlist updated')} className="flex-1 bg-amber-500 hover:bg-amber-600">
                  <Heart className="h-4 w-4 mr-2" />
                  Save All to Wishlist
                </Button>
              </div>
            </div>
          </div>

          {/* Checkout Sidebar */}
          <div className="lg:col-span-1 space-y-6 sticky top-4 self-start">
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-400" /> Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-amber-300">Subtotal ({cartItems.length} items):</span>
                    <span className="font-semibold text-white">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-300">Shipping ({country}):</span>
                    <span className="font-semibold text-white">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-300">Tax ({(taxRate * 100).toFixed(0)}% {country}):</span>
                    <span className="font-semibold text-white">${tax.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount:</span>
                      <span className="font-semibold">- ${(subtotal * discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator className="bg-amber-500/20" />
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-300">
                    Total: ${total.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">In {currency} ({country})</p>
                </div>
              </CardContent>
            </Card>

            {/* Discount Input */}
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Gift className="h-4 w-4 text-amber-400" /> Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Enter code (e.g., WELCOME10)"
                    className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500"
                  />
                  <Button onClick={applyDiscount} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
                    <Percent className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
                {discount > 0 && (
                  <Alert className="mt-4 bg-green-500/10 border-green-500">
                    <Zap className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      {discount}% off! <span className="font-semibold">Saved ${(subtotal * discount / 100).toFixed(2)}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Shipping */}
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Truck className="h-4 w-4 text-amber-400" /> Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-amber-300 text-sm">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-transparent border-amber-500/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-amber-500/30">
                      <SelectItem value="ET">Ethiopia</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="EU">European Union</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-300 text-sm">Address</Label>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Full address (street, city, ZIP)"
                    className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500 resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="text-amber-300 text-sm">City</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-amber-300 text-sm">ZIP Code</Label>
                    <Input
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="ZIP"
                      className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <Label className="text-amber-300 text-sm">Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-amber-300">
                  Estimated: {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`} | Total weight: {totalWeight.toFixed(1)}kg
                </p>
              </CardContent>
            </Card>

            {/* Currency Selector */}
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-amber-400" /> Currency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-transparent border-amber-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-amber-500/30">
                    {SUPPORTED_CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-amber-400" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Button
                    variant={paymentMethod === 'card' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('card')}
                    className="w-full justify-start bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-white"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Credit/Debit Card (Visa/Mastercard)
                  </Button>
                  <Button
                    variant={paymentMethod === 'crypto' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('crypto')}
                    className="w-full justify-start bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Cryptocurrency (BTC/ETH/USDT)
                  </Button>
                </div>
                {paymentMethod === 'card' && (
                  <div className="mt-4 p-4 bg-black/20 rounded-lg">
                    <CardElement 
                      options={{ 
                        style: { 
                          base: { 
                            color: 'white', 
                            fontSize: '16px',
                            '::placeholder': { color: '#9ca3af' },
                            backgroundColor: 'transparent',
                            border: '1px solid #f59e0b'
                          } 
                        } 
                      }} 
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gift Options */}
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Gift className="h-4 w-4 text-amber-400" /> Gift Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Checkbox
                  checked={giftWrap}
                  onCheckedChange={setGiftWrap}
                >
                  <Label className="text-amber-300 text-sm">Gift Wrap (+$5)</Label>
                </Checkbox>
                <Checkbox
                  checked={expressShipping}
                  onCheckedChange={setExpressShipping}
                >
                  <Label className="text-amber-300 text-sm">Express Shipping (+$15)</Label>
                </Checkbox>
                <div>
                  <Label className="text-amber-300 text-sm">Special Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions? (e.g., 'Happy Birthday!')"
                    className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500 resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="bg-white/5 backdrop-blur-md border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-amber-400" /> Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-amber-300 text-sm">Email</Label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500"
                  />
                </div>
                <div>
                  <Label className="text-amber-300 text-sm">Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder=" +251 911 234 567"
                    className="bg-transparent border-amber-500/30 text-white placeholder-amber-300 focus:border-amber-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Terms and Checkout */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox 
                  checked={termsAccepted}
                  onCheckedChange={setTermsAccepted}
                />
                <div className="space-y-1">
                  <Label className="text-amber-300 text-sm">
                    I agree to the <a href="/terms" className="underline hover:text-amber-200">Terms of Service</a> and <a href="/privacy" className="underline hover:text-amber-200">Privacy Policy</a>
                  </Label>
                  <Checkbox
                    checked={newsletterSubscribe}
                    onCheckedChange={setNewsletterSubscribe}
                  >
                    <Label className="text-xs text-amber-400">
                      Subscribe to newsletter for exclusive deals
                    </Label>
                  </Checkbox>
                  <Checkbox
                    checked={savePaymentInfo}
                    onCheckedChange={setSavePaymentInfo}
                  >
                    <Label className="text-xs text-amber-400">
                      Save payment info for faster checkout
                    </Label>
                  </Checkbox>
                </div>
              </div>
              <Button 
                onClick={handleCheckout}
                size="lg" 
                className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold py-4 text-lg shadow-lg disabled:opacity-50"
                disabled={!termsAccepted || !address || !city || !postalCode || updating}
              >
                {updating ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                {updating ? 'Processing...' : `Proceed to Secure Checkout - Total: ${currency} ${total.toFixed(2)}`}
              </Button>
            </div>

            {/* Security Badge */}
            <div className="text-center py-4">
              <Shield className="h-6 w-6 mx-auto mb-2 text-green-400" />
              <p className="text-xs text-amber-300">Secure 256-bit SSL | PCI Compliant | 30-Day Returns | Global Shipping</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}