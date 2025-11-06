// Path: app/api/orders/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const orderSchema = z.object({
  items: z.array(z.object({ bookId: z.number(), quantity: z.number() })),
  total: z.number().positive(),
});

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: { user: process.env.EMAIL_FROM, pass: process.env.EMAIL_PASS },
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({
      where: { userId: parseInt(session.user.id) },
      include: { items: { include: { book: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { items, total } = orderSchema.parse(await req.json());
    const userId = parseInt(session.user.id);

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: { include: { book: true } } },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cart: { userId } } });

    // Email confirmation
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: session.user.email,
      subject: 'Order Confirmed - BookWise Pro',
      text: `Your order #${order.id} is confirmed! Total: $${total}. Thank you!`,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}