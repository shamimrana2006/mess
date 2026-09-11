import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = searchParams.get('year') || now.getFullYear().toString();
    const month = searchParams.get('month') || (now.getMonth() + 1).toString().padStart(2, '0');
    const monthPrefix = `${year}-${month}`;

    const todayDay = now.getDate().toString().padStart(2, '0');
    const todayDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${todayDay}`;

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

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { role: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        deposit: true,
      },
    });

    // Get all meals for this month
    const meals = await prisma.meal.findMany({
      where: {
        date: {
          startsWith: monthPrefix,
        },
      },
    });

    // Get all bazar records for this month
    const bazars = await prisma.bazar.findMany({
      where: {
        date: {
          startsWith: monthPrefix,
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
      const netBalance = (user.deposit || 0) + bazarContributed - mealCost;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    const todayTotalCookedMeals = todayMeals.reduce((acc, m) => {
      const l = m.isLunchCooked ? m.lunch : 0;
      const d = m.isDinnerCooked ? m.dinner : 0;
      return acc + (l + d);
    }, 0);

    const totalDeposits = users.reduce((acc, u) => acc + (u.deposit || 0), 0);

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
      stats: {
        totalMessMeals: totalMessCookedMeals, // Ranna hoye geche emon mill
        todayTotalMeals: todayTotalCookedMeals,
        totalBazarExpense,
        mealRate,
        totalDeposits,
        activeMembersCount: users.length,
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
