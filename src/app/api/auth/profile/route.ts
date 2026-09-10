import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser, hashPassword, comparePassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন' }, { status: 401 });
    }

    const { name, phone, currentPassword, newPassword } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'নামের ঘর খালি রাখা যাবে না' }, { status: 400 });
    }

    const updateData: any = {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
    };

    // If changing password
    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }, { status: 400 });
      }

      // If current password was provided, verify it
      if (currentPassword) {
        const fullUser = await prisma.user.findUnique({
          where: { id: currentUser.id },
        });

        if (fullUser) {
          const isMatch = await comparePassword(currentPassword, fullUser.password);
          if (!isMatch) {
            return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়' }, { status: 400 });
          }
        }
      }

      updateData.password = await hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
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
      message: '✅ আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
