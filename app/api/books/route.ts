// Path: app/api/books/route.ts
// Full API Integration for Books Page – Queries Prisma DB with filters, search, sort, pagination
// Compatible with your schema.prisma (Book model: id, title, author, category, price, rating, reviewCount, stock, image, description, createdAt)

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const minPrice = parseFloat(searchParams.get('minPrice') || '0');
    const maxPrice = parseFloat(searchParams.get('maxPrice') || '1000');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const sort = searchParams.get('sort') || 'rating';  // 'rating', 'price', 'createdAt', etc.
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');  // For true pagination

    // Build dynamic where clause
    const where: any = {
      AND: [
        { price: { gte: minPrice, lte: maxPrice } },
        { rating: { gte: minRating } },
        ...(search ? [
          {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { author: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          },
        ] : []),
        ...(category ? [{ category }] : []),
        { stock: true },  // Optional: Only in-stock books
      ].filter(Boolean),
    };

    // Dynamic sort
    const orderBy = sort === 'price' ? { price: 'desc' } : sort === 'createdAt' ? { createdAt: 'desc' } : { [sort]: 'desc' };

    // Query with pagination
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        select: {
          id: true,
          title: true,
          author: true,
          category: true,
          price: true,
          rating: true,
          reviewCount: true,
          stock: true,
          image: true,
          description: true,
          createdAt: true,
        },
      }),
      prisma.book.count({ where }),
    ]);

    return NextResponse.json({ books, total });
  } catch (error) {
    console.error('Books API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}