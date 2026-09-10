import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signJwtToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'নাম, ইমেইল এবং পাসওয়ার্ড পূরণ করুন' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট খোলা আছে' }, { status: 400 });
    }

    // Check if this is the first user in the system, make them Manager automatically
    const totalUsers = await prisma.user.count();
    const assignedRole = totalUsers === 0 ? 'MANAGER' : (role === 'MANAGER' ? 'MANAGER' : 'MEMBER');

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        role: assignedRole,
        deposit: 0,
      },
    });

    const token = signJwtToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        phone: newUser.phone,
        deposit: newUser.deposit,
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। ডাটাবেজ কানেকশন চেক করুন।' },
      { status: 500 }
    );
  }
}
