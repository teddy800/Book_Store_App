// Path: lib/cartStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSession } from 'next-auth/react';  // For session

interface CartItem {
  id: number;
  bookId: number;
  quantity: number;
  price: number;
  title: string;  // For local display
}

interface CartState {
  items: CartItem[];
  addItem: (book: { id: number; price: number; title: string }) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  syncFromAPI: () => void;  // New: Load from DB on mount
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (book) => {
        const { items } = get();
        const existing = items.find((item) => item.bookId === book.id);
        if (existing) {
          set({ items: items.map((item) => item.bookId === book.id ? { ...item, quantity: item.quantity + 1 } : item) });
        } else {
          set({ items: [...items, { ...book, bookId: book.id, quantity: 1 }] });
        }
        // Sync to API
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id, quantity: 1 }),
        });
      },
      removeItem: async (id) => {
        set({ items: get().items.filter((item) => item.bookId !== id) });
        await fetch(`/api/cart?bookId=${id}`, { method: 'DELETE' });
      },
      updateQuantity: async (id, quantity) => {
        set({ items: get().items.map((item) => item.bookId === id ? { ...item, quantity } : item) });
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: id, quantity }),
        });
      },
      clearCart: () => set({ items: [] }),
      syncFromAPI: async () => {
        const { data: session } = useSession();
        if (session) {
          const res = await fetch('/api/cart');
          if (res.ok) {
            const { items } = await res.json();
            set({ items: items.map((item: any) => ({ ...item.book, bookId: item.bookId, quantity: item.quantity })) });
          }
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);