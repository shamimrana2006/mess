import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { role: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        deposit: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ members: users });
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json({ error: 'মেম্বার তালিকা আনতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার এই পরিবর্তন করতে পারবেন' }, { status: 403 });
    }

    const { id, name, email, password, role, phone, deposit } = await req.json();

    // If ID is provided, it's an update (e.g. deposit or role)
    if (id) {
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
      if (role) updateData.role = role;
      if (deposit !== undefined) updateData.deposit = Number(deposit);
      if (password && password.length >= 6) {
        updateData.password = await hashPassword(password);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          deposit: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'মেম্বার তথ্য সফলভাবে আপডেট হয়েছে',
        member: updated,
      });
    }

    // Creating a new member
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'নাম, ইমেইল এবং পাসওয়ার্ড পূরণ করুন' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'এই ইমেইল দিয়ে ইতিমধ্যে একাউন্ট আছে' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    const newMember = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: role === 'MANAGER' ? 'MANAGER' : 'MEMBER',
        phone: phone ? phone.trim() : null,
        deposit: Number(deposit) || 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        deposit: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'নতুন মেম্বার যুক্ত হয়েছে',
      member: newMember,
    });
  } catch (error) {
    console.error('Member save error:', error);
    return NextResponse.json({ error: 'মেম্বার সংরক্ষণ করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'MANAGER') {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার মেম্বার ডিলিট করতে পারবেন' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'মেম্বার আইডি দিন' }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json({ error: 'ম্যানেজার নিজেকে ডিলিট করতে পারবেন না' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'মেম্বার সফলভাবে মুছে ফেলা হয়েছে' });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'মেম্বার মুছতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
