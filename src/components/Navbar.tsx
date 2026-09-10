'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User as UserIcon, LogOut, Lock, Unlock } from 'lucide-react';
import { UserSession } from '@/lib/types';

interface NavbarProps {
  user: UserSession | null;
  isLunchLocked?: boolean;
  isDinnerLocked?: boolean;
  messName?: string;
  onRefresh?: () => void;
}

export default function Navbar({
  user,
  isLunchLocked = false,
  isDinnerLocked = false,
  messName = 'মেস মিল ম্যানেজার',
  onRefresh,
}: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Mess Title & Status */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
            ম
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-tight flex items-center gap-1.5 truncate max-w-[160px]">
              {messName}
            </h1>
            <div className="flex items-center gap-1 mt-0.5 text-[10px]">
              {isLunchLocked ? (
                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> দুপুর লক
                </span>
              ) : (
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                  <Unlock className="w-2.5 h-2.5" /> দুপুর চালু
                </span>
              )}
              {isDinnerLocked ? (
                <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> রাত লক
                </span>
              ) : (
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                  <Unlock className="w-2.5 h-2.5" /> রাত চালু
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-200 truncate max-w-[90px]">
                  {user.name.split(' ')[0]}
                </p>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 ${
                    user.role === 'MANAGER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {user.role === 'MANAGER' ? (
                    <>
                      <ShieldCheck className="w-2.5 h-2.5" /> ম্যানেজার
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-2.5 h-2.5" /> মেম্বার
                    </>
                  )}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="লগআউট"
                className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
            >
              লগইন
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
