import { NextResponse } from 'next/server';
import { getCurrentUser, removeAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ user: null });
  }
}

export async function POST() {
  try {
    removeAuthCookie();
    return NextResponse.json({ success: true, message: 'সফলভাবে লগআউট হয়েছে' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'লগআউট ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
