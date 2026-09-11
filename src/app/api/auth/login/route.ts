import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signJwtToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'ইউজার পাওয়া যায়নি! ইমেইল চেক করুন বা রেজিস্টার করুন' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন' }, { status: 401 });
    }

    const token = signJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'PENDING',
        phone: user.phone,
        deposit: user.deposit,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'লগইন করতে সমস্যা হয়েছে। ডাটাবেজ কানেকশন চেক করুন।' },
      { status: 500 }
    );
  }
}
