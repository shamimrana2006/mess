import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { UserSession } from './types';

export const JWT_SECRET = process.env.JWT_SECRET || 'mess_calculation_super_secret_jwt_key_2026_vercell_free';
export const COOKIE_NAME = 'mess_auth_token';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signJwtToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyJwtToken(token: string): { id: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyJwtToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
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

    if (!user) return null;

    return {
      ...user,
      role: user.role as 'MANAGER' | 'MEMBER',
      status: (user.status || 'PENDING') as 'APPROVED' | 'PENDING' | 'REJECTED',
    };
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

export function setAuthCookie(token: string) {
  try {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
  } catch (err) {
    console.error('Error setting cookie in store:', err);
  }
}

export function removeAuthCookie() {
  try {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  } catch (err) {
    console.error('Error removing cookie:', err);
  }
}
