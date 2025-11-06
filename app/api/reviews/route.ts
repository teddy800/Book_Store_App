// Path: app/api/reviews/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const reviewSchema = z.object({
  bookId: z.number(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookId = parseInt(searchParams.get('bookId') || '0');

  try {
    const reviews = await prisma.review.findMany({
      where: { bookId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { bookId, rating, comment } = reviewSchema.parse(await req.json());

    const review = await prisma.review.create({
      data: { userId: parseInt(session.user.id), bookId, rating, comment },
    });

    // Update book rating/reviews count
    const avgRating = await prisma.review.aggregate({
      where: { bookId },
      _avg: { rating: true },
    });
    await prisma.book.update({
      where: { id: bookId },
      data: {
        rating: avgRating._avg.rating || 0,
        reviews: { increment: 1 },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add review' }, { status: 400 });
  }
}