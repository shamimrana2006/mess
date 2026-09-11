'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Flame, Sun, Moon, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ManagerLockToggleProps {
  isLunchLocked: boolean;
  isDinnerLocked: boolean;
  todayCookedStatus?: {
    isLunchCooked: boolean;
    isDinnerCooked: boolean;
  };
  onToggleSuccess: () => void;
}

export default function ManagerLockToggle({
  isLunchLocked,
  isDinnerLocked,
  todayCookedStatus = { isLunchCooked: false, isDinnerCooked: false },
  onToggleSuccess,
}: ManagerLockToggleProps) {
  const [lunchLocked, setLunchLocked] = useState(isLunchLocked);
  const [dinnerLocked, setDinnerLocked] = useState(isDinnerLocked);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 1. Lock/Unlock before or during cooking
  const handleToggleLunchLock = async () => {
    try {
      setIsUpdating('lunchLock');
      setMessage(null);
      const newStatus = !lunchLocked;

      const res = await fetch('/api/meals/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLunchLocked: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সমস্যা হয়েছে');

      setLunchLocked(newStatus);
      onToggleSuccess();
      setMessage(newStatus ? '🔒 দুপুরের মিল লক করা হয়েছে' : '🔓 দুপুরের মিল আনলক করা হয়েছে');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'সমস্যা হয়েছে');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleDinnerLock = async () => {
    try {
      setIsUpdating('dinnerLock');
      setMessage(null);
      const newStatus = !dinnerLocked;

      const res = await fetch('/api/meals/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDinnerLocked: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সমস্যা হয়েছে');

      setDinnerLocked(newStatus);
      onToggleSuccess();
      setMessage(newStatus ? '🔒 রাতের মিল লক করা হয়েছে' : '🔓 রাতের মিল আনলক করা হয়েছে');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'সমস্যা হয়েছে');
    } finally {
      setIsUpdating(null);
    }
  };

  // 2. Mark as Cooked ("রান্না হয়ে গেছে") -> Freezes permanently and adds to monthly total calculation
  const handleMarkCooked = async (mealType: 'lunch' | 'dinner') => {
    const banglaName = mealType === 'lunch' ? 'দুপুরের' : 'রাতের';
    if (!confirm(`আপনি কি নিশ্চিত যে আজকের ${banglaName} রান্না সম্পন্ন হয়েছে?\n(রান্না সম্পন্ন হলে এই মিল আর কেউ এডিট করতে পারবে না এবং মেসের মোট মিলে যুক্ত হবে)`)) {
      return;
    }

    try {
      setIsUpdating(`cooked_${mealType}`);
      setMessage(null);

      const res = await fetch('/api/meals/cooked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType, isCooked: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'রান্না সম্পন্ন চিহ্নিত করা যায়নি');

      // Also lock the meal
      await fetch('/api/meals/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(mealType === 'lunch' ? { isLunchLocked: true } : { isDinnerLocked: true }),
        }),
      });

      if (mealType === 'lunch') setLunchLocked(true);
      else setDinnerLocked(true);

      onToggleSuccess();
      setMessage(data.message || `✅ ${banglaName} রান্না সম্পন্ন হয়েছে!`);
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'সমস্যা হয়েছে');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/80 to-slate-900/90 shadow-lg space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              ম্যানেজার রান্নার কন্ট্রোল প্যানেল
            </h4>
            <p className="text-[11px] text-slate-400">
              রান্না হয়ে যাওয়া মিল ম্যানেজার সহ কেউ এডিট করতে পারবে না
            </p>
          </div>
        </div>
      </div>

      {/* Lunch & Dinner Controls */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* ☀️ Lunch Control Card */}
        <div className="bg-slate-900/85 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> দুপুর
            </span>
            {todayCookedStatus.isLunchCooked ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> রান্না শেষ
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                চলমান
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {/* Lock/Unlock Toggle */}
            <button
              onClick={handleToggleLunchLock}
              disabled={isUpdating === 'lunchLock' || todayCookedStatus.isLunchCooked}
              className={`w-full py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40 active:scale-95 ${
                lunchLocked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
              }`}
            >
              {lunchLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{lunchLocked ? 'দুপুর লকড (আনলক)' : 'দুপুর লক করুন'}</span>
            </button>

            {/* "রান্না হয়ে গেছে" Finalize Button */}
            {!todayCookedStatus.isLunchCooked ? (
              <button
                onClick={() => handleMarkCooked('lunch')}
                disabled={isUpdating === 'cooked_lunch'}
                className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>রান্না হয়ে গেছে</span>
              </button>
            ) : (
              <div className="text-[11px] text-center text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 rounded-xl border border-emerald-500/20">
                🔒 মিল ফাইনাল
              </div>
            )}
          </div>
        </div>

        {/* 🌙 Dinner Control Card */}
        <div className="bg-slate-900/85 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5" /> রাত
            </span>
            {todayCookedStatus.isDinnerCooked ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> রান্না শেষ
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                চলমান
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {/* Lock/Unlock Toggle */}
            <button
              onClick={handleToggleDinnerLock}
              disabled={isUpdating === 'dinnerLock' || todayCookedStatus.isDinnerCooked}
              className={`w-full py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-40 active:scale-95 ${
                dinnerLocked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
              }`}
            >
              {dinnerLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{dinnerLocked ? 'রাত লকড (আনলক)' : 'রাত লক করুন'}</span>
            </button>

            {/* "রান্না হয়ে গেছে" Finalize Button */}
            {!todayCookedStatus.isDinnerCooked ? (
              <button
                onClick={() => handleMarkCooked('dinner')}
                disabled={isUpdating === 'cooked_dinner'}
                className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>রান্না হয়ে গেছে</span>
              </button>
            ) : (
              <div className="text-[11px] text-center text-emerald-400 font-semibold bg-emerald-500/10 py-1.5 rounded-xl border border-emerald-500/20">
                🔒 মিল ফাইনাল
              </div>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className="text-center text-xs font-semibold text-emerald-300 bg-emerald-500/10 py-2 px-3 rounded-xl border border-emerald-500/20 animate-fade-in">
          {message}
        </div>
      )}
    </div>
  );
}
