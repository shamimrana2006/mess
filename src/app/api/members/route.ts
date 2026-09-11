import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    const whereClause: any = {};
    if (!currentUser || currentUser.role !== 'ADMIN') {
      whereClause.role = { not: 'ADMIN' };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
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
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার বা অ্যাডমিন এই পরিবর্তন করতে পারবেন' }, { status: 403 });
    }

    const { id, name, email, password, role, status, phone, deposit } = await req.json();

    // If ID is provided, it's an update (e.g. deposit, role, or approval status)
    if (id) {
      const updateData: any = {};
      if (name) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
      if (role) {
        if (!['ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
          return NextResponse.json({ error: 'সঠিক রোল নির্বাচন করুন' }, { status: 400 });
        }
        updateData.role = role;
      }
      if (status) updateData.status = status;
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
          status: true,
          phone: true,
          deposit: true,
        },
      });

      let successMsg = 'মেম্বার তথ্য সফলভাবে আপডেট হয়েছে';
      if (role && role === 'MANAGER') {
        successMsg = `👑 "${updated.name}" কে সফলভাবে ম্যানেজার বানানো হয়েছে!`;
      } else if (role && role === 'MEMBER') {
        successMsg = `👤 "${updated.name}" কে সাধারণ মেম্বার করা হয়েছে।`;
      } else if (role && role === 'ADMIN') {
        successMsg = `⚡ "${updated.name}" কে সুপার অ্যাডমিন করা হয়েছে!`;
      } else if (status === 'APPROVED') {
        successMsg = `✅ "${updated.name}" মেম্বার সফলভাবে অনুমোদন করা হয়েছে`;
      }

      return NextResponse.json({
        success: true,
        message: successMsg,
        member: updated,
      });
    }

    // Creating a new member manually by manager or admin
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

    const validRole = ['ADMIN', 'MANAGER', 'MEMBER'].includes(role) ? role : 'MEMBER';

    const newMember = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: validRole,
        status: status || 'APPROVED', // Manager-added members are automatically approved
        phone: phone ? phone.trim() : null,
        deposit: Number(deposit) || 0,
      },
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
    if (!currentUser || (currentUser.role !== 'MANAGER' && currentUser.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'শুধুমাত্র ম্যানেজার বা অ্যাডমিন মেম্বার ডিলিট করতে পারবেন' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'মেম্বার আইডি দিন' }, { status: 400 });
    }

    if (id === currentUser.id) {
      return NextResponse.json({ error: 'আপনি নিজেকে ডিলিট করতে পারবেন না' }, { status: 400 });
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
