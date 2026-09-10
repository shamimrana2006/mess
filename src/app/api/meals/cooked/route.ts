import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getTodayDateString } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার রান্না সম্পন্ন চিহ্নিত করতে পারবেন' }, { status: 403 });
    }

    const { date, mealType, isCooked = true } = await req.json();
    const targetDate = date || getTodayDateString();

    if (!['lunch', 'dinner', 'all'].includes(mealType)) {
      return NextResponse.json({ error: 'মিল টাইপ দিন (lunch অথবা dinner)' }, { status: 400 });
    }

    // Get all users
    const allUsers = await prisma.user.findMany({ select: { id: true } });

    // Update or create meal records for every user for this date
    for (const user of allUsers) {
      const existing = await prisma.meal.findUnique({
        where: { userId_date: { userId: user.id, date: targetDate } },
      });

      const updateData: any = {};
      if (mealType === 'lunch' || mealType === 'all') updateData.isLunchCooked = isCooked;
      if (mealType === 'dinner' || mealType === 'all') updateData.isDinnerCooked = isCooked;

      if (existing) {
        await prisma.meal.update({
          where: { id: existing.id },
          data: updateData,
        });
      } else {
        await prisma.meal.create({
          data: {
            userId: user.id,
            date: targetDate,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            total: 0,
            isLunchCooked: mealType === 'lunch' || mealType === 'all' ? isCooked : false,
            isDinnerCooked: mealType === 'dinner' || mealType === 'all' ? isCooked : false,
          },
        });
      }
    }

    const typeBangla = mealType === 'lunch' ? 'দুপুরের' : mealType === 'dinner' ? 'রাতের' : 'আজকের সারাদিনের';

    return NextResponse.json({
      success: true,
      message: `✅ ${typeBangla} রান্না সম্পন্ন হিসেবে চিহ্নিত করা হয়েছে!`,
      date: targetDate,
      mealType,
      isCooked,
    });
  } catch (error) {
    console.error('Cooked toggle error:', error);
    return NextResponse.json({ error: 'রান্না সম্পন্ন আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
