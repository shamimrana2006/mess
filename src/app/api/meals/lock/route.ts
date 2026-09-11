import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayDateString } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // YYYY-MM
    const date = searchParams.get('date');

    const settings = await prisma.messSettings.findUnique({
      where: { id: 'main_settings' },
    });

    const whereClause: any = {};
    if (date) whereClause.date = date;
    else if (month) whereClause.date = { startsWith: month };

    const dailyLocks = await prisma.dailyLock.findMany({
      where: whereClause,
    });

    return NextResponse.json({ settings, dailyLocks });
  } catch (error) {
    console.error('Get lock settings error:', error);
    return NextResponse.json({ error: 'সেটিংস লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার বা অ্যাডমিন লক পরিবর্তন করতে পারবেন' }, { status: 403 });
    }

    const { date, isLunchLocked, isDinnerLocked, lockPastDays, cutoffTime, fixedCosts, messName } = await req.json();
    const todayStr = getTodayDateString();
    const targetDate = date || todayStr;

    // 1. If date-specific lock is provided, update or create DailyLock record
    let updatedDailyLock = null;
    if (isLunchLocked !== undefined || isDinnerLocked !== undefined) {
      const existing = await prisma.dailyLock.findUnique({
        where: { date: targetDate },
      });

      updatedDailyLock = await prisma.dailyLock.upsert({
        where: { date: targetDate },
        update: {
          ...(isLunchLocked !== undefined && { isLunchLocked }),
          ...(isDinnerLocked !== undefined && { isDinnerLocked }),
        },
        create: {
          date: targetDate,
          isLunchLocked: isLunchLocked ?? false,
          isDinnerLocked: isDinnerLocked ?? false,
        },
      });
    }

    // 2. If target date is today or global settings are updated, update MessSettings
    let updatedSettings = null;
    if (targetDate === todayStr || lockPastDays !== undefined || cutoffTime !== undefined || fixedCosts !== undefined || messName !== undefined) {
      updatedSettings = await prisma.messSettings.upsert({
        where: { id: 'main_settings' },
        update: {
          ...(targetDate === todayStr && isLunchLocked !== undefined && { isLunchLocked }),
          ...(targetDate === todayStr && isDinnerLocked !== undefined && { isDinnerLocked }),
          ...(lockPastDays !== undefined && { lockPastDays }),
          ...(cutoffTime !== undefined && { cutoffTime }),
          ...(fixedCosts !== undefined && { fixedCosts: Number(fixedCosts) }),
          ...(messName !== undefined && { messName }),
        },
        create: {
          id: 'main_settings',
          messName: messName || 'আমাদের মেস (Mess Calculation)',
          isLunchLocked: targetDate === todayStr && isLunchLocked !== undefined ? isLunchLocked : false,
          isDinnerLocked: targetDate === todayStr && isDinnerLocked !== undefined ? isDinnerLocked : false,
          lockPastDays: lockPastDays ?? true,
          cutoffTime: cutoffTime || '10:00',
          fixedCosts: Number(fixedCosts) || 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${targetDate} তারিখের লক সেটিংস সফলভাবে আপডেট হয়েছে`,
      settings: updatedSettings,
      dailyLock: updatedDailyLock,
    });
  } catch (error) {
    console.error('Update lock settings error:', error);
    return NextResponse.json({ error: 'লক সেটিংস আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
