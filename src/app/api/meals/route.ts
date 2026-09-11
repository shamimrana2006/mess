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

    const whereClause: any = {
      user: {
        role: { not: 'ADMIN' },
      },
    };
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

    const { targetUserId, date, lunch, dinner, updatedField } = await req.json();

    if (!date) {
      return NextResponse.json({ error: 'তারিখ নির্বাচন করুন' }, { status: 400 });
    }

    const isManager = currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN';

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

    const isDateLunchLocked = Boolean(dailyLock?.isLunchLocked || (date === today && settings?.isLunchLocked));
    const isDateDinnerLocked = Boolean(dailyLock?.isDinnerLocked || (date === today && settings?.isDinnerLocked));

    const isLunchCooked = Boolean(existingMeal?.isLunchCooked);
    const isDinnerCooked = Boolean(existingMeal?.isDinnerCooked);

    // 2. CRITICAL RULE: "manager ranna hoyejaoya mill o edit korte parbena"
    // If lunch/dinner is marked as COOKED, NOBODY (including manager) can edit it!
    if (isLunchCooked && lunch !== undefined && lunch !== (existingMeal?.lunch ?? 0)) {
      return NextResponse.json(
        { error: '🛑 দুপুরের রান্না সম্পন্ন হয়ে গেছে! রান্না হয়ে যাওয়া মিল ম্যানেজার সহ কেউ পরিবর্তন করতে পারবে না।' },
        { status: 403 }
      );
    }

    if (isDinnerCooked && dinner !== undefined && dinner !== (existingMeal?.dinner ?? 0)) {
      return NextResponse.json(
        { error: '🛑 রাতের রান্না সম্পন্ন হয়ে গেছে! রান্না হয়ে যাওয়া মিল ম্যানেজার সহ কেউ পরিবর্তন করতে পারবে না।' },
        { status: 403 }
      );
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
      if (isDateLunchLocked && lunch !== undefined && lunch !== (existingMeal?.lunch ?? 0)) {
        return NextResponse.json(
          { error: '🔒 এই তারিখের দুপুরের মিল ম্যানেজার লক করে রেখেছেন' },
          { status: 403 }
        );
      }

      if (isDateDinnerLocked && dinner !== undefined && dinner !== (existingMeal?.dinner ?? 0)) {
        return NextResponse.json(
          { error: '🔒 এই তারিখের রাতের মিল ম্যানেজার লক করে রেখেছেন' },
          { status: 403 }
        );
      }
    }

    // 4. Calculate final values strictly preserving locked/cooked fields if not authorized
    let finalLunch = existingMeal ? existingMeal.lunch : 0;
    if (lunch !== undefined) {
      if (!isLunchCooked && (isManager || !isDateLunchLocked)) {
        finalLunch = Math.max(0, Number(lunch) || 0);
      }
    }

    let finalDinner = existingMeal ? existingMeal.dinner : 0;
    if (dinner !== undefined) {
      if (!isDinnerCooked && (isManager || !isDateDinnerLocked)) {
        finalDinner = Math.max(0, Number(dinner) || 0);
      }
    }

    const total = finalLunch + finalDinner;
    const nowBangla = getFormattedBanglaTimestamp();

    const prevLunch = existingMeal ? existingMeal.lunch : 0;
    const prevDinner = existingMeal ? existingMeal.dinner : 0;

    // Detect if lunch or dinner was actually explicitly changed
    let isLunchChanged = false;
    let isDinnerChanged = false;

    if (updatedField === 'lunch') {
      isLunchChanged = true;
    } else if (updatedField === 'dinner') {
      isDinnerChanged = true;
    } else {
      if (lunch !== undefined) {
        if (existingMeal) {
          if (finalLunch !== prevLunch) isLunchChanged = true;
        } else {
          if (finalLunch > 0) isLunchChanged = true;
        }
      }
      if (dinner !== undefined) {
        if (existingMeal) {
          if (finalDinner !== prevDinner) isDinnerChanged = true;
        } else {
          if (finalDinner > 0) isDinnerChanged = true;
        }
      }
    }

    let lunchUpdatedTime = existingMeal?.lunchUpdatedTime || null;
    let dinnerUpdatedTime = existingMeal?.dinnerUpdatedTime || null;

    if (isLunchChanged) {
      lunchUpdatedTime = nowBangla;
    }
    if (isDinnerChanged) {
      dinnerUpdatedTime = nowBangla;
    }

    const meal = await prisma.meal.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      update: {
        breakfast: 0,
        lunch: finalLunch,
        dinner: finalDinner,
        total,
        lunchUpdatedTime,
        dinnerUpdatedTime,
        updatedTime: nowBangla,
      },
      create: {
        userId,
        date,
        breakfast: 0,
        lunch: finalLunch,
        dinner: finalDinner,
        total,
        isLunchCooked: false,
        isDinnerCooked: false,
        lunchUpdatedTime,
        dinnerUpdatedTime,
        updatedTime: nowBangla,
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
