import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signJwtToken, setAuthCookie } from '@/lib/auth';

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

    setAuthCookie(token);

    return NextResponse.json({
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
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
