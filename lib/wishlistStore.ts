// Path: lib/wishlistStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useSession } from 'next-auth/react';

interface WishlistState {
  items: Book[];
  addItem: (book: Book) => void;
  removeItem: (id: number) => void;
  syncFromAPI: () => void;  // New: Load from DB
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (book) => {
        const { items } = get();
        if (!items.find((item) => item.id === book.id)) {
          set({ items: [...items, book] });
        }
        // Sync to API
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId: book.id }),
        });
      },
      removeItem: async (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
        await fetch(`/api/wishlist?bookId=${id}`, { method: 'DELETE' });
      },
      syncFromAPI: async () => {
        const { data: session } = useSession();
        if (session) {
          const res = await fetch('/api/wishlist');
          if (res.ok) {
            const { items } = await res.json();
            set({ items: items.map((item: any) => item.book) });
          }
        }
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);