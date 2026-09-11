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
      <div className="max-w-md mx-auto flex items-center justify-between gap-3">
        {/* Mess Title & Status */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-lg shrink-0">
            ম
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight truncate">
              {messName}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
              {isLunchLocked ? (
                <span className="text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded-md border border-rose-500/30 inline-flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5" /> দুপুর লক
                </span>
              ) : (
                <span className="text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/30 inline-flex items-center gap-1 font-medium">
                  <Unlock className="w-2.5 h-2.5" /> দুপুর চালু
                </span>
              )}
              {isDinnerLocked ? (
                <span className="text-rose-300 bg-rose-500/15 px-1.5 py-0.5 rounded-md border border-rose-500/30 inline-flex items-center gap-1 font-medium">
                  <Lock className="w-2.5 h-2.5" /> রাত লক
                </span>
              ) : (
                <span className="text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/30 inline-flex items-center gap-1 font-medium">
                  <Unlock className="w-2.5 h-2.5" /> রাত চালু
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-100 truncate max-w-[100px]">
                  {user.name.split(' ')[0]}
                </p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 ${
                    user.role === 'MANAGER'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {user.role === 'MANAGER' ? (
                    <>
                      <ShieldCheck className="w-3 h-3" /> ম্যানেজার
                    </>
                  ) : (
                    <>
                      <UserIcon className="w-3 h-3" /> মেম্বার
                    </>
                  )}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="লগআউট"
                className="w-8 h-8 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 border border-slate-700/80 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
            >
              লগইন
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
