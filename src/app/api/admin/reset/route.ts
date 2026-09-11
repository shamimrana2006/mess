import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '⛔ শুধুমাত্র সুপার এডমিন (ADMIN) সম্পূর্ণ মেস ডেটা রিসেট করার ক্ষমতা রাখেন।' },
        { status: 403 }
      );
    }

    const { action, month } = await req.json();

    if (action === 'reset_meals_bazar') {
      // Delete all meals, bazars, and daily locks
      await prisma.meal.deleteMany({});
      await prisma.bazar.deleteMany({});
      await prisma.dailyLock.deleteMany({});

      // Reset today locks in MessSettings
      await prisma.messSettings.upsert({
        where: { id: 'main_settings' },
        update: {
          isLunchLocked: false,
          isDinnerLocked: false,
        },
        create: {
          id: 'main_settings',
          isLunchLocked: false,
          isDinnerLocked: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: '✅ মেসের সকল মিল ও বাজারের হিসাব সফলভাবে রিসেট (শূন্য) করা হয়েছে! মেম্বার অ্যাকাউন্ট অপরিবর্তিত রয়েছে।',
      });
    }

    if (action === 'reset_month') {
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'সঠিক মাস নির্বাচন করুন (যেমন: 2026-09)' }, { status: 400 });
      }

      await prisma.meal.deleteMany({
        where: {
          date: { startsWith: month },
        },
      });

      await prisma.bazar.deleteMany({
        where: {
          date: { startsWith: month },
        },
      });

      await prisma.dailyLock.deleteMany({
        where: {
          date: { startsWith: month },
        },
      });

      await prisma.deposit.deleteMany({
        where: {
          date: { startsWith: month },
        },
      });

      return NextResponse.json({
        success: true,
        message: `✅ ${month} মাসের সকল মিল, বাজার ও জমার হিসাব সফলভাবে রিসেট করা হয়েছে!`,
      });
    }

    if (action === 'full_reset') {
      // Full system reset:
      // 1. Delete all meals
      await prisma.meal.deleteMany({});

      // 2. Delete all bazars
      await prisma.bazar.deleteMany({});

      // 3. Delete all daily locks
      await prisma.dailyLock.deleteMany({});

      // 4. Delete all deposits
      await prisma.deposit.deleteMany({});

      // 5. Reset all users deposits to 0
      await prisma.user.updateMany({
        data: {
          deposit: 0,
        },
      });

      // 5. Reset MessSettings to defaults
      await prisma.messSettings.upsert({
        where: { id: 'main_settings' },
        update: {
          messName: 'আমাদের মেস (Mess Calculation)',
          isLunchLocked: false,
          isDinnerLocked: false,
          lockPastDays: true,
          cutoffTime: '10:00',
          fixedCosts: 0,
        },
        create: {
          id: 'main_settings',
          messName: 'আমাদের মেস (Mess Calculation)',
          isLunchLocked: false,
          isDinnerLocked: false,
          lockPastDays: true,
          cutoffTime: '10:00',
          fixedCosts: 0,
        },
      });

      return NextResponse.json({
        success: true,
        message: '💥 সম্পূর্ণ মেস সিস্টেম সফলভাবে ফ্যাক্টরি রিসেট করা হয়েছে! সকল মিল, বাজার ও জমা শূন্য হয়ে নতুনভাবে চালু হয়েছে।',
      });
    }

    return NextResponse.json({ error: 'অকার্যকর অ্যাকশন' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin reset error:', error);
    return NextResponse.json(
      { error: error?.message || 'ডাটা রিসেট করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
