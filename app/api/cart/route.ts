import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';  // Corrected: Import 'auth' (NextAuth v5 export) – no authOptions needed
import { z } from 'zod';

// Cart schema for validation (tailored for book store – bookId, quantity)
const cartSchema = z.object({
  bookId: z.number().int().positive('Book ID must be a positive integer'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});

// GET: Retrieve user's cart with populated items and books
export async function GET(request: NextRequest) {
  try {
    const session = await auth();  // Corrected: Use 'auth()' for v5 session (replaces getServerSession(authOptions))
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized – please sign in' }, { status: 401 });
    }

    const { user } = session;
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            book: {
              select: { id: true, title: true, price: true, image: true, stock: true },  // Optimize: Select only needed fields
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      cart: cart ?? { id: null, userId: user.id, items: [] },
      totalItems: cart?.items?.length ?? 0 
    });
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    return NextResponse.json({ error: 'Server error while fetching cart' }, { status: 500 });
  }
}

// POST: Add or update cart item (increment quantity if exists)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();  // Corrected: Direct 'auth()' call
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized – please sign in' }, { status: 401 });
    }

    const { user } = session;
    const body = await request.json();
    const { bookId, quantity } = cartSchema.parse(body);

    // Ensure cart exists
    let cart = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    // Check for existing item (use your schema's unique index – e.g., cartId + bookId)
    let cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_bookId: {  // Standard composite unique key – adjust if your schema uses different (e.g., add userId)
          cartId: cart.id,
          bookId,
        },
      },
    });

    const isUpdate = !!cartItem;  // Track if updating existing item

    if (cartItem) {
      // Increment quantity
      cartItem = await prisma.cartItem.update({
        where: { id: cartItem.id },
        data: { quantity: { increment: quantity } },
      });
    } else {
      // Create new item – check stock first (assuming stock is boolean; adjust if number)
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book || !book.stock) {  // Fixed: Boolean stock check (no < quantity for boolean)
        return NextResponse.json({ error: 'Book out of stock or invalid ID' }, { status: 400 });
      }

      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          bookId,
          quantity,
        },
      });
    }

    // Return refreshed cart
    cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            book: {
              select: { id: true, title: true, price: true, image: true, stock: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ 
      cart,
      message: isUpdate ? 'Cart updated' : 'Item added to cart'  // Fixed: Correct message based on isUpdate
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.issues.map(issue => issue.message).join(', ') 
      }, { status: 400 });
    }
    console.error('Failed to update cart:', error);
    return NextResponse.json({ error: 'Server error while updating cart' }, { status: 500 });
  }
}

// PUT: Update specific item quantity (e.g., from UI adjustment)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    const body = await request.json();
    const { bookId, quantity } = cartSchema.parse(body);

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const updateResult = await prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        bookId,
      },
      data: { quantity },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Quantity updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Failed to update cart item:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE: Remove item from cart by bookId
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = session;
    const { searchParams } = new URL(request.url);
    const bookId = Number(searchParams.get('bookId') ?? 0);

    if (!bookId || isNaN(bookId)) {  // Fixed: isNaN(0) is false, but !bookId catches 0
      return NextResponse.json({ error: 'Book ID is required in query params' }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      return NextResponse.json({ message: 'No cart found (nothing removed)' }, { status: 200 });
    }

    const deleteResult = await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        bookId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Failed to delete cart item:', error);
    return NextResponse.json({ error: 'Server error while removing item' }, { status: 500 });
  }
}