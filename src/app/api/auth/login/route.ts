import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, signJwtToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'ইমেইল এবং পাসওয়ার্ড প্রয়োজন' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'ইউজার পাওয়া যায়নি! ইমেইল চেক করুন' }, { status: 401 });
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

    setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        deposit: user.deposit,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'লগইন করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
