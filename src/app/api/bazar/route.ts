import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM

    const whereClause: any = {};
    if (month) {
      whereClause.date = { startsWith: month };
    }

    const bazars = await prisma.bazar.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalBazarAmount = bazars.reduce((acc, item) => acc + item.amount, 0);

    return NextResponse.json({ bazars, totalBazarAmount });
  } catch (error) {
    console.error('Fetch bazar error:', error);
    return NextResponse.json({ error: 'বাজারের তালিকা আনতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন' }, { status: 401 });
    }

    // USER REQUIREMENT: Only manager can add or update bazar
    if (currentUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার বাজার খরচ যোগ করতে পারবেন' }, { status: 403 });
    }

    const { targetUserId, date, amount, items, notes } = await req.json();

    if (!date || !amount || !items) {
      return NextResponse.json({ error: 'তারিখ, টাকার পরিমাণ এবং পণ্যের নাম দিন' }, { status: 400 });
    }

    const userId = targetUserId || currentUser.id;

    const bazar = await prisma.bazar.create({
      data: {
        userId,
        date,
        amount: Number(amount),
        items: items.trim(),
        notes: notes ? notes.trim() : null,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'বাজার খরচ সফলভাবে যুক্ত হয়েছে',
      bazar,
    });
  } catch (error) {
    console.error('Add bazar error:', error);
    return NextResponse.json({ error: 'বাজার হিসাব যুক্ত করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'লগইন প্রয়োজন' }, { status: 401 });
    }

    // USER REQUIREMENT: Only manager can delete bazar
    if (currentUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার বাজার খরচ মুছে ফেলতে পারবেন' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'আইডি প্রয়োজন' }, { status: 400 });
    }

    const item = await prisma.bazar.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: 'বাজার এন্ট্রি পাওয়া যায়নি' }, { status: 404 });
    }

    await prisma.bazar.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'বাজার হিসাব মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('Delete bazar error:', error);
    return NextResponse.json({ error: 'বাজার হিসাব মুছতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
