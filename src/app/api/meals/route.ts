import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getFormattedBanglaTimestamp, getTodayDateString } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const userId = searchParams.get('userId');

    const whereClause: any = {};
    if (date) whereClause.date = date;
    else if (month) whereClause.date = { startsWith: month };
    if (userId) whereClause.userId = userId;

    const meals = await prisma.meal.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ meals });
  } catch (error) {
    console.error('Fetch meals error:', error);
    return NextResponse.json({ error: 'মিল তালিকা আনতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন' }, { status: 401 });
    }

    const { targetUserId, date, lunch, dinner } = await req.json();

    if (!date) {
      return NextResponse.json({ error: 'তারিখ নির্বাচন করুন' }, { status: 400 });
    }

    const isManager = currentUser.role === 'MANAGER';

    // 1. Authorization: A member CANNOT edit another member's meal!
    if (!isManager && targetUserId && targetUserId !== currentUser.id) {
      return NextResponse.json(
        { error: '🚫 আপনি অন্য মেম্বারের মিল পরিবর্তন করতে পারবেন না! শুধুমাত্র নিজের মিল পরিবর্তন করতে পারেন।' },
        { status: 403 }
      );
    }

    const userId = isManager && targetUserId ? targetUserId : currentUser.id;
    const today = getTodayDateString();

    // Check Mess Settings and DailyLock for Lock Status
    const settings = await prisma.messSettings.findUnique({
      where: { id: 'main_settings' },
    });

    const dailyLock = await prisma.dailyLock.findUnique({
      where: { date },
    });

    const existingMeal = await prisma.meal.findUnique({
      where: { userId_date: { userId, date } },
    });

    const l = Math.max(0, Number(lunch) || 0);
    const d = Math.max(0, Number(dinner) || 0);

    // 2. CRITICAL RULE: "manager ranna hoyejaoya mill o edit korte parbena"
    // If lunch/dinner is marked as COOKED, NOBODY (including manager) can edit it!
    if (existingMeal) {
      if (existingMeal.isLunchCooked && existingMeal.lunch !== l) {
        return NextResponse.json(
          { error: '🛑 দুপুরের রান্না সম্পন্ন হয়ে গেছে! রান্না হয়ে যাওয়া মিল ম্যানেজার সহ কেউ পরিবর্তন করতে পারবে না।' },
          { status: 403 }
        );
      }

      if (existingMeal.isDinnerCooked && existingMeal.dinner !== d) {
        return NextResponse.json(
          { error: '🛑 রাতের রান্না সম্পন্ন হয়ে গেছে! রান্না হয়ে যাওয়া মিল ম্যানেজার সহ কেউ পরিবর্তন করতে পারবে না।' },
          { status: 403 }
        );
      }
    }

    // 3. Normal member locking rules (per-date lock or today lock or past days)
    if (!isManager) {
      // Past days check
      if (date < today && (settings?.lockPastDays ?? true)) {
        return NextResponse.json(
          { error: '🔒 পূর্ববর্তী দিনের মিল পরিবর্তন করার অনুমতি নেই' },
          { status: 403 }
        );
      }

      // Check per-date locks
      const isDateLunchLocked = Boolean(dailyLock?.isLunchLocked || (date === today && settings?.isLunchLocked));
      const isDateDinnerLocked = Boolean(dailyLock?.isDinnerLocked || (date === today && settings?.isDinnerLocked));

      if (isDateLunchLocked && existingMeal && existingMeal.lunch !== l) {
        return NextResponse.json(
          { error: '🔒 এই তারিখের দুপুরের মিল ম্যানেজার লক করে রেখেছেন' },
          { status: 403 }
        );
      }

      if (isDateDinnerLocked && existingMeal && existingMeal.dinner !== d) {
        return NextResponse.json(
          { error: '🔒 এই তারিখের রাতের মিল ম্যানেজার লক করে রেখেছেন' },
          { status: 403 }
        );
      }
    }

    const total = l + d;
    const updatedTime = getFormattedBanglaTimestamp();

    const meal = await prisma.meal.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        breakfast: 0,
        lunch: l,
        dinner: d,
        total,
        updatedTime,
      },
      create: {
        userId,
        date,
        breakfast: 0,
        lunch: l,
        dinner: d,
        total,
        isLunchCooked: false,
        isDinnerCooked: false,
        updatedTime,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'মিল সফলভাবে আপডেট হয়েছে',
      meal,
    });
  } catch (error) {
    console.error('Save meal error:', error);
    return NextResponse.json({ error: 'মিল সেভ করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
