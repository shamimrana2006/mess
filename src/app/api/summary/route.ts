import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getBangladeshDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bdTime = getBangladeshDateTime();
    const year = searchParams.get('year') || bdTime.year.toString();
    const month = searchParams.get('month') || bdTime.month.toString().padStart(2, '0');
    const monthPrefix = `${year}-${month}`;
    const todayDate = bdTime.dateStr;

    // Get or create mess settings
    let settings = await prisma.messSettings.findUnique({
      where: { id: 'main_settings' },
    });

    if (!settings) {
      settings = await prisma.messSettings.create({
        data: {
          id: 'main_settings',
          messName: 'আমাদের মেস (Mess Calculation)',
          isLunchLocked: false,
          isDinnerLocked: false,
          lockPastDays: true,
          cutoffTime: '10:00',
          fixedCosts: 0,
        },
      });
    }

    // Check today's date lock in DailyLock table
    const todayDailyLock = await prisma.dailyLock.findUnique({
      where: { date: todayDate },
    });

    const isTodayLunchLocked = Boolean(todayDailyLock?.isLunchLocked || settings.isLunchLocked);
    const isTodayDinnerLocked = Boolean(todayDailyLock?.isDinnerLocked || settings.isDinnerLocked);

    // Get only APPROVED eating users (and managers) - EXCLUDING ADMIN!
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' },
        OR: [
          { status: 'APPROVED' },
          { role: 'MANAGER' },
        ],
      },
      orderBy: { role: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        deposit: true,
      },
    });

    const pendingMembersCount = await prisma.user.count({
      where: {
        status: 'PENDING',
        role: { not: 'ADMIN' },
      },
    });

    // Get all meals for this month (excluding admin users)
    const meals = await prisma.meal.findMany({
      where: {
        date: {
          startsWith: monthPrefix,
        },
        user: {
          role: { not: 'ADMIN' },
        },
      },
    });

    // Get all bazar records for this month (excluding admin users)
    const bazars = await prisma.bazar.findMany({
      where: {
        date: {
          startsWith: monthPrefix,
        },
        user: {
          role: { not: 'ADMIN' },
        },
      },
    });

    // CRITICAL USER REQUIREMENT:
    // "maser total mill calculation hobe ranna hoyegeche emon mill gulur"
    // Total mess meal count ONLY includes meals that have been cooked (isLunchCooked / isDinnerCooked)!
    const totalMessCookedMeals = meals.reduce((acc, m) => {
      const cookedLunch = m.isLunchCooked ? m.lunch : 0;
      const cookedDinner = m.isDinnerCooked ? m.dinner : 0;
      return acc + (cookedLunch + cookedDinner);
    }, 0);

    const totalBazarExpense = bazars.reduce((acc, b) => acc + b.amount, 0);
    const mealRate = totalMessCookedMeals > 0 ? totalBazarExpense / totalMessCookedMeals : 0;

    const fixedPerMember = users.length > 0 ? (settings.fixedCosts || 0) / users.length : 0;

    // Build member breakdown (Calculated strictly based on COOKED meals)
    const membersSummary = users.map((user) => {
      const userMeals = meals.filter((m) => m.userId === user.id);
      const userBazars = bazars.filter((b) => b.userId === user.id);

      const cookedLunchCount = userMeals.reduce((acc, m) => acc + (m.isLunchCooked ? m.lunch : 0), 0);
      const cookedDinnerCount = userMeals.reduce((acc, m) => acc + (m.isDinnerCooked ? m.dinner : 0), 0);
      const userTotalCookedMeals = cookedLunchCount + cookedDinnerCount;

      const plannedLunchCount = userMeals.reduce((acc, m) => acc + m.lunch, 0);
      const plannedDinnerCount = userMeals.reduce((acc, m) => acc + m.dinner, 0);
      const userTotalPlannedMeals = plannedLunchCount + plannedDinnerCount;

      const todayMealRecord = userMeals.find((m) => m.date === todayDate);
      const todayMeals = todayMealRecord ? (todayMealRecord.lunch + todayMealRecord.dinner) : 0;

      const bazarContributed = userBazars.reduce((acc, b) => acc + b.amount, 0);
      const mealCost = userTotalCookedMeals * mealRate + fixedPerMember;
      // CRITICAL: Bazar money is taken from the Mess Main Fund, NOT member's personal money.
      // Therefore, bazar expense does NOT increase member's deposit or balance.
      const netBalance = (user.deposit || 0) - mealCost;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status as 'APPROVED' | 'PENDING' | 'REJECTED',
        phone: user.phone,
        deposit: user.deposit || 0,
        totalMeals: userTotalCookedMeals, // Official Cooked Meals for rate & balances
        plannedMeals: userTotalPlannedMeals,
        todayMeals,
        bazarContributed,
        mealCost,
        netBalance,
        mealsCount: {
          lunch: cookedLunchCount,
          dinner: cookedDinnerCount,
        },
      };
    });

    // Check today's cooking status across meals
    const todayMeals = meals.filter((m) => m.date === todayDate);
    const isTodayLunchCooked = todayMeals.length > 0 && todayMeals.some((m) => m.isLunchCooked);
    const isTodayDinnerCooked = todayMeals.length > 0 && todayMeals.some((m) => m.isDinnerCooked);

    const todayTotalLunch = todayMeals.reduce((acc, m) => acc + (m.lunch || 0), 0);
    const todayTotalDinner = todayMeals.reduce((acc, m) => acc + (m.dinner || 0), 0);
    const todayTotalCookedMeals = todayMeals.reduce((acc, m) => {
      const l = m.isLunchCooked ? m.lunch : 0;
      const d = m.isDinnerCooked ? m.dinner : 0;
      return acc + (l + d);
    }, 0);

    const totalDeposits = users.reduce((acc, u) => acc + (u.deposit || 0), 0);
    const remainingFund = totalDeposits - totalBazarExpense - (settings.fixedCosts || 0);

    return NextResponse.json({
      settings: {
        messName: settings.messName,
        isLunchLocked: isTodayLunchLocked,
        isDinnerLocked: isTodayDinnerLocked,
        lockPastDays: settings.lockPastDays,
        cutoffTime: settings.cutoffTime,
        fixedCosts: settings.fixedCosts,
      },
      todayCookedStatus: {
        isLunchCooked: isTodayLunchCooked,
        isDinnerCooked: isTodayDinnerCooked,
      },
      todayMessMeals: {
        lunch: todayTotalLunch,
        dinner: todayTotalDinner,
        total: todayTotalLunch + todayTotalDinner,
      },
      stats: {
        totalMessMeals: totalMessCookedMeals, // Ranna hoye geche emon mill
        todayTotalMeals: todayTotalCookedMeals,
        totalBazarExpense,
        mealRate,
        totalDeposits,
        remainingFund,
        activeMembersCount: users.length,
        pendingMembersCount,
      },
      members: membersSummary,
      todayDate,
      month: `${year}-${month}`,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json({ error: 'মেস তথ্য লোড করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
