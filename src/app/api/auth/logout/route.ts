import { NextResponse } from 'next/server';
import { removeAuthCookie } from '@/lib/auth';

export async function POST() {
  try {
    removeAuthCookie();
    return NextResponse.json({ success: true, message: 'সফলভাবে লগআউট হয়েছে' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'লগআউট ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
