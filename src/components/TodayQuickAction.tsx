'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Lock, CheckCircle2, Clock, Plus, Minus, AlertTriangle, Sun, Moon, ShieldAlert } from 'lucide-react';
import { toBanglaNumber, getTodayDateString } from '@/lib/utils';
import { UserSession } from '@/lib/types';

interface TodayQuickActionProps {
  user: UserSession | null;
  isLunchLocked: boolean;
  isDinnerLocked: boolean;
  todayCookedStatus?: {
    isLunchCooked: boolean;
    isDinnerCooked: boolean;
  };
  onMealUpdated: () => void;
}

export default function TodayQuickAction({
  user,
  isLunchLocked,
  isDinnerLocked,
  todayCookedStatus = { isLunchCooked: false, isDinnerCooked: false },
  onMealUpdated,
}: TodayQuickActionProps) {
  const todayStr = getTodayDateString();
  const [lunch, setLunch] = useState<number>(0);
  const [dinner, setDinner] = useState<number>(0);
  const [isLunchCooked, setIsLunchCooked] = useState<boolean>(false);
  const [isDinnerCooked, setIsDinnerCooked] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // A member cannot edit if manager locked it.
  // And NEITHER MEMBER NOR MANAGER can edit if it has already been COOKED!
  const isLunchDisabled = (isLunchLocked && user?.role !== 'MANAGER') || isLunchCooked;
  const isDinnerDisabled = (isDinnerLocked && user?.role !== 'MANAGER') || isDinnerCooked;

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchTodayMeal = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/meals?date=${todayStr}&userId=${user.id}`);
        const data = await res.json();

        if (data.meals && data.meals.length > 0) {
          const m = data.meals[0];
          setLunch(m.lunch !== undefined ? m.lunch : 0);
          setDinner(m.dinner !== undefined ? m.dinner : 0);
          setIsLunchCooked(Boolean(m.isLunchCooked));
          setIsDinnerCooked(Boolean(m.isDinnerCooked));
          setLastSavedTime(m.updatedTime || null);
        } else {
          setLunch(0);
          setDinner(0);
          setIsLunchCooked(false);
          setIsDinnerCooked(false);
          setLastSavedTime(null);
        }
      } catch (err) {
        console.error('Failed to load today meal', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodayMeal();
  }, [user, todayStr, todayCookedStatus]);

  const handleSave = async (l = lunch, d = dinner) => {
    if (!user) return;

    try {
      setIsSaving(true);
      setMessage(null);

      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: todayStr,
          lunch: l,
          dinner: d,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'মিল সেভ ব্যর্থ হয়েছে');
      }

      setLastSavedTime(data.meal?.updatedTime || 'এখনই');
      setMessage({ text: '✅ আজকের মিল সংরক্ষিত হয়েছে!', type: 'success' });
      onMealUpdated();

      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateMealCount = (type: 'lunch' | 'dinner', delta: number) => {
    if (type === 'lunch') {
      if (isLunchDisabled) return;
      const newVal = Math.max(0, lunch + delta);
      setLunch(newVal);
      handleSave(newVal, dinner);
    } else {
      if (isDinnerDisabled) return;
      const newVal = Math.max(0, dinner + delta);
      setDinner(newVal);
      handleSave(lunch, newVal);
    }
  };

  const totalToday = lunch + dinner;

  return (
    <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/20 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              আজকের মিল এন্ট্রি
            </h3>
            <p className="text-xs text-slate-400">
              আপনার মোট মিল:{' '}
              <strong className="text-emerald-300 font-bold">
                {toBanglaNumber(totalToday)} টি
              </strong>
            </p>
          </div>
        </div>

        {/* Timestamp */}
        {lastSavedTime && (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/50">
              <Clock className="w-3 h-3 text-emerald-400" /> {lastSavedTime}
            </span>
          </div>
        )}
      </div>

      {/* Warnings Banner if Cooked or Locked */}
      {(isLunchCooked || isDinnerCooked || isLunchLocked || isDinnerLocked) && (
        <div className="mb-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
          {isLunchCooked ? (
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>দুপুরের রান্না সম্পন্ন হয়ে গেছে (এডিট লকড)।</span>
            </div>
          ) : isLunchLocked && user?.role !== 'MANAGER' ? (
            <div className="flex items-center gap-1.5 text-rose-300 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>খালা দুপুরের রান্না শুরু করেছেন (দুপুর লক)।</span>
            </div>
          ) : null}

          {isDinnerCooked ? (
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>রাতের রান্না সম্পন্ন হয়ে গেছে (এডিট লকড)।</span>
            </div>
          ) : isDinnerLocked && user?.role !== 'MANAGER' ? (
            <div className="flex items-center gap-1.5 text-rose-300 font-medium">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>খালা রাতের রান্না শুরু করেছেন (রাত লক)।</span>
            </div>
          ) : null}
        </div>
      )}

      {/* 2 Meal Steppers: Lunch & Dinner */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lunch */}
        <div
          className={`glass-panel p-3.5 rounded-2xl flex flex-col items-center border transition-all ${
            isLunchCooked
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : isLunchDisabled
              ? 'border-rose-500/30 bg-rose-950/10'
              : 'border-slate-800 bg-slate-900/80'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-200">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>দুপুরের মিল</span>
            {isLunchCooked ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-500/30">রান্না শেষ</span>
            ) : isLunchDisabled ? (
              <Lock className="w-3 h-3 text-rose-400" />
            ) : null}
          </div>

          <span className="text-3xl font-black text-white my-1 tracking-tight">
            {isLoading ? (
              <span className="animate-pulse text-slate-500 text-lg">...</span>
            ) : (
              toBanglaNumber(lunch)
            )}
          </span>

          <div className="flex items-center gap-2.5 w-full justify-center mt-1">
            <button
              disabled={isLoading || isLunchDisabled || lunch <= 0 || isSaving}
              onClick={() => updateMealCount('lunch', -1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 transition-all active:scale-90 border border-slate-700/60"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              disabled={isLoading || isLunchDisabled || isSaving}
              onClick={() => updateMealCount('lunch', 1)}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-emerald-600/30 font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dinner */}
        <div
          className={`glass-panel p-3.5 rounded-2xl flex flex-col items-center border transition-all ${
            isDinnerCooked
              ? 'border-emerald-500/30 bg-emerald-950/20'
              : isDinnerDisabled
              ? 'border-rose-500/30 bg-rose-950/10'
              : 'border-slate-800 bg-slate-900/80'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-slate-200">
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>রাতের মিল</span>
            {isDinnerCooked ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-500/30">রান্না শেষ</span>
            ) : isDinnerDisabled ? (
              <Lock className="w-3 h-3 text-rose-400" />
            ) : null}
          </div>

          <span className="text-3xl font-black text-white my-1 tracking-tight">
            {isLoading ? (
              <span className="animate-pulse text-slate-500 text-lg">...</span>
            ) : (
              toBanglaNumber(dinner)
            )}
          </span>

          <div className="flex items-center gap-2.5 w-full justify-center mt-1">
            <button
              disabled={isLoading || isDinnerDisabled || dinner <= 0 || isSaving}
              onClick={() => updateMealCount('dinner', -1)}
              className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 transition-all active:scale-90 border border-slate-700/60"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              disabled={isLoading || isDinnerDisabled || isSaving}
              onClick={() => updateMealCount('dinner', 1)}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all active:scale-90 shadow-lg shadow-emerald-600/30 font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mt-2.5 p-2 rounded-lg text-xs flex items-center gap-1.5 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
