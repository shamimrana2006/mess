import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getBangladeshDateTime, getFormattedBanglaTimestamp } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');

    const whereClause: any = {
      user: {
        role: { not: 'ADMIN' },
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }
    if (month) {
      whereClause.date = { startsWith: month };
    }

    const deposits = await prisma.deposit.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

    return NextResponse.json({
      deposits,
      totalAmount,
    });
  } catch (error) {
    console.error('Fetch deposits error:', error);
    return NextResponse.json({ error: 'জমার তালিকা আনতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: '⛔ শুধুমাত্র ম্যানেজার বা এডমিন টাকা জমা আপডেট বা যুক্ত করতে পারবেন।' },
        { status: 403 }
      );
    }

    const { id, userId, amount, date, notes } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'মেম্বার নির্বাচন করুন' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'সঠিক জমার পরিমাণ (টাকা) দিন' }, { status: 400 });
    }

    const bdNow = getBangladeshDateTime();
    const depositDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : bdNow.dateStr;
    const formattedTime = getFormattedBanglaTimestamp();

    let depositRecord;

    if (id) {
      // Edit existing deposit
      depositRecord = await prisma.deposit.update({
        where: { id },
        data: {
          userId,
          amount: numAmount,
          date: depositDate,
          notes: notes ? notes.trim() : null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } else {
      // Create new deposit entry
      depositRecord = await prisma.deposit.create({
        data: {
          userId,
          amount: numAmount,
          date: depositDate,
          time: formattedTime,
          notes: notes ? notes.trim() : null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }

    // Recalculate and sync total deposit for this user
    const userAllDeposits = await prisma.deposit.findMany({
      where: { userId },
    });
    const totalUserDeposit = userAllDeposits.reduce((sum, d) => sum + d.amount, 0);

    await prisma.user.update({
      where: { id: userId },
      data: { deposit: totalUserDeposit },
    });

    return NextResponse.json({
      success: true,
      message: `✅ ৳ ${numAmount} জমা সফলভাবে সংরক্ষিত হয়েছে (${formattedTime})`,
      deposit: depositRecord,
      totalUserDeposit,
    });
  } catch (error) {
    console.error('Save deposit error:', error);
    return NextResponse.json({ error: 'জমা সংরক্ষণ করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: '⛔ শুধুমাত্র ম্যানেজার বা এডমিন জমা ডিলিট করতে পারবেন।' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'জমার আইডি প্রদান করুন' }, { status: 400 });
    }

    const existing = await prisma.deposit.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'জমার রেকর্ড পাওয়া যায়নি' }, { status: 404 });
    }

    const targetUserId = existing.userId;

    await prisma.deposit.delete({
      where: { id },
    });

    // Re-sync user deposit sum
    const userAllDeposits = await prisma.deposit.findMany({
      where: { userId: targetUserId },
    });
    const totalUserDeposit = userAllDeposits.reduce((sum, d) => sum + d.amount, 0);

    await prisma.user.update({
      where: { id: targetUserId },
      data: { deposit: totalUserDeposit },
    });

    return NextResponse.json({
      success: true,
      message: 'জমার এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে',
      totalUserDeposit,
    });
  } catch (error) {
    console.error('Delete deposit error:', error);
    return NextResponse.json({ error: 'জমা মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
