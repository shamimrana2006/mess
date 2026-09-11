'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Utensils, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      setError('ইমেইল এবং পাসওয়ার্ড পূরণ করুন');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'manager' | 'member') => {
    if (role === 'admin') {
      setEmail('admin@mess.com');
      setPassword('123456');
      handleLogin(undefined, 'admin@mess.com', '123456');
    } else if (role === 'manager') {
      setEmail('manager@mess.com');
      setPassword('123456');
      handleLogin(undefined, 'manager@mess.com', '123456');
    } else {
      setEmail('rakib@mess.com');
      setPassword('123456');
      handleLogin(undefined, 'rakib@mess.com', '123456');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-emerald-500/25">
          <Utensils className="w-8 h-8 text-slate-950 font-black" />
        </div>
        <h1 className="text-2xl font-black text-white">মেস মিল ম্যানেজার</h1>
        <p className="text-xs text-slate-400 mt-1">
          সহজ ও নির্ভুল মিল ও খরচের হিসাব
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full glass-card rounded-3xl p-6 border border-emerald-500/20 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100 mb-1">লগইন করুন</h2>
        <p className="text-xs text-slate-400 mb-5">
          আপনার ইমেইল ও পাসওয়ার্ড দিয়ে প্রবেশ করুন
        </p>

        <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              ইমেইল
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              পাসওয়ার্ড
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'প্রবেশ হচ্ছে...' : 'লগইন করুন'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Manager Login */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 text-center mb-3 font-medium">
            বা দ্রুত ম্যানেজার একাউন্টে প্রবেশ করুন:
          </p>
          <button
            onClick={() => handleDemoLogin('manager')}
            disabled={isLoading}
            className="w-full p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" /> ম্যানেজার লগইন (manager@mess.com)
          </button>
        </div>

        {/* Register Link */}
        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            নতুন মেম্বার?{' '}
            <Link
              href="/register"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              রেজিস্ট্রেশন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
