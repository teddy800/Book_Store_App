// Path: app/api/wishlist/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const wishlistSchema = z.object({
  bookId: z.number(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: parseInt(session.user.id) },
      include: { items: { include: { book: true } } },
    });
    return NextResponse.json({ items: wishlist?.items || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookId } = wishlistSchema.parse(await req.json());
    const userId = parseInt(session.user.id);

    let wishlist = await prisma.wishlist.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    await prisma.wishlistItem.upsert({
      where: { wishlistId_bookId: { wishlistId: wishlist.id, bookId } },
      update: {},
      create: { wishlistId: wishlist.id, bookId },
    });

    const updatedWishlist = await prisma.wishlist.findUnique({
      where: { id: wishlist.id },
      include: { items: { include: { book: true } } },
    });

    return NextResponse.json({ items: updatedWishlist?.items || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { bookId: number } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlist: { userId: parseInt(session.user.id) },
        bookId: params.bookId,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}