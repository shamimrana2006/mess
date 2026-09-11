'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Flame,
  User as UserIcon,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';
import {
  toBanglaNumber,
  getTodayDateString,
  getBanglaMonthName,
  getBangladeshDateTime,
} from '@/lib/utils';
import { UserSession, MealRecord, MemberSummary } from '@/lib/types';

interface DailyLockRecord {
  date: string;
  isLunchLocked: boolean;
  isDinnerLocked: boolean;
}

interface MealCalendarProps {
  currentUser: UserSession | null;
  allMembers: MemberSummary[];
  isLunchLocked: boolean;
  isDinnerLocked: boolean;
  lockPastDays?: boolean;
}

export default function MealCalendar({
  currentUser,
  allMembers,
  isLunchLocked: defaultLunchLocked,
  isDinnerLocked: defaultDinnerLocked,
  lockPastDays = true,
}: MealCalendarProps) {
  const bdNow = getBangladeshDateTime();
  const todayStr = bdNow.dateStr;
  const [currentDate, setCurrentDate] = useState(() => new Date(bdNow.year, bdNow.month - 1, bdNow.day));
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || '');
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [dailyLocks, setDailyLocks] = useState<Record<string, { isLunchLocked: boolean; isDinnerLocked: boolean }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Day Edit Modal state
  const [activeDateStr, setActiveDateStr] = useState<string | null>(null);
  const [dateMembersMeals, setDateMembersMeals] = useState<MealRecord[]>([]);
  const [isLoadingDateMeals, setIsLoadingDateMeals] = useState<boolean>(false);
  const [activeMeal, setActiveMeal] = useState<{
    lunch: number;
    dinner: number;
    isLunchCooked?: boolean;
    isDinnerCooked?: boolean;
    updatedTime?: string | null;
  }>({ lunch: 0, dinner: 0 });
  const [activeDayLock, setActiveDayLock] = useState<{ isLunchLocked: boolean; isDinnerLocked: boolean }>({
    isLunchLocked: false,
    isDinnerLocked: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLocking, setIsLocking] = useState<string | null>(null);
  const [modalMessage, setModalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = (month + 1).toString().padStart(2, '0');
  const monthPrefix = `${year}-${monthStr}`;

  const isManager = currentUser?.role === 'MANAGER';

  useEffect(() => {
    if (!isManager && currentUser?.id) {
      setSelectedUserId(currentUser.id);
    } else if (isManager && currentUser?.id && !selectedUserId) {
      setSelectedUserId(currentUser.id);
    }
  }, [currentUser, isManager, selectedUserId]);

  // Fetch meals and date-specific locks for the month
  const fetchMonthData = async () => {
    const targetId = isManager ? selectedUserId : currentUser?.id;
    if (!targetId) return;

    try {
      setIsLoading(true);
      // 1. Fetch meals for active user
      const res = await fetch(`/api/meals?month=${monthPrefix}&userId=${targetId}`);
      const data = await res.json();
      if (data.meals) {
        setMeals(data.meals);
      }

      // 2. Fetch locks for this month
      const lockRes = await fetch(`/api/meals/lock?month=${monthPrefix}`);
      const lockData = await lockRes.json();
      if (lockData.dailyLocks) {
        const lockMap: Record<string, { isLunchLocked: boolean; isDinnerLocked: boolean }> = {};
        lockData.dailyLocks.forEach((dl: DailyLockRecord) => {
          lockMap[dl.date] = {
            isLunchLocked: dl.isLunchLocked,
            isDinnerLocked: dl.isDinnerLocked,
          };
        });
        setDailyLocks(lockMap);
      }
    } catch (err) {
      console.error('Failed to load month meals and locks', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData();
  }, [monthPrefix, selectedUserId, isManager, currentUser?.id]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1);
    setCurrentDate(newDate);
  };

  // Fetch all members' meals for the clicked date
  const fetchDateAllMeals = async (targetDateStr: string, currentTargetUserId: string) => {
    try {
      setIsLoadingDateMeals(true);
      const res = await fetch(`/api/meals?date=${targetDateStr}`);
      const data = await res.json();
      if (data.meals) {
        setDateMembersMeals(data.meals);
        const myMeal = data.meals.find((m: MealRecord) => m.userId === currentTargetUserId);
        if (myMeal) {
          setActiveMeal({
            lunch: myMeal.lunch,
            dinner: myMeal.dinner,
            isLunchCooked: Boolean(myMeal.isLunchCooked),
            isDinnerCooked: Boolean(myMeal.isDinnerCooked),
            updatedTime: myMeal.updatedTime,
          });
        } else {
          setActiveMeal({
            lunch: 0,
            dinner: 0,
            isLunchCooked: false,
            isDinnerCooked: false,
            updatedTime: null,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load date meals', err);
    } finally {
      setIsLoadingDateMeals(false);
    }
  };

  const handleDayClick = (day: number) => {
    const dayFormatted = day.toString().padStart(2, '0');
    const targetDateStr = `${year}-${monthStr}-${dayFormatted}`;
    setActiveDateStr(targetDateStr);

    const targetId = isManager ? selectedUserId : currentUser?.id || '';
    fetchDateAllMeals(targetDateStr, targetId);

    // Load active date lock status
    const currentLock = dailyLocks[targetDateStr] || {
      isLunchLocked: targetDateStr === todayStr ? defaultLunchLocked : false,
      isDinnerLocked: targetDateStr === todayStr ? defaultDinnerLocked : false,
    };
    setActiveDayLock(currentLock);

    setModalMessage(null);
  };

  // Check whether Lunch is locked for a date
  const isLunchLockedForDate = (targetDate: string, isCooked = activeMeal.isLunchCooked) => {
    if (isCooked) return true;
    if (isManager) return false; // Manager can always edit unless cooked
    const lockInfo = dailyLocks[targetDate];
    if (lockInfo?.isLunchLocked) return true;
    if (targetDate === todayStr && defaultLunchLocked) return true;
    if (targetDate < todayStr && lockPastDays) return true;
    return false;
  };

  // Check whether Dinner is locked for a date
  const isDinnerLockedForDate = (targetDate: string, isCooked = activeMeal.isDinnerCooked) => {
    if (isCooked) return true;
    if (isManager) return false; // Manager can always edit unless cooked
    const lockInfo = dailyLocks[targetDate];
    if (lockInfo?.isDinnerLocked) return true;
    if (targetDate === todayStr && defaultDinnerLocked) return true;
    if (targetDate < todayStr && lockPastDays) return true;
    return false;
  };

  // Manager: Toggle Lunch Lock for active date
  const handleToggleLunchLock = async () => {
    if (!activeDateStr || !isManager) return;
    try {
      setIsLocking('lunch');
      const newStatus = !activeDayLock.isLunchLocked;

      const res = await fetch('/api/meals/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activeDateStr,
          isLunchLocked: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সমস্যা হয়েছে');

      setActiveDayLock((prev) => ({ ...prev, isLunchLocked: newStatus }));
      setDailyLocks((prev) => ({
        ...prev,
        [activeDateStr]: {
          ...(prev[activeDateStr] || { isLunchLocked: false, isDinnerLocked: false }),
          isLunchLocked: newStatus,
        },
      }));

      setModalMessage({
        text: newStatus ? '🔒 দুপুরের মিল লক করা হয়েছে' : '🔓 দুপুরের মিল আনলক করা হয়েছে',
        type: 'success',
      });
      setTimeout(() => setModalMessage(null), 3000);
    } catch (err: any) {
      setModalMessage({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsLocking(null);
    }
  };

  // Manager: Toggle Dinner Lock for active date
  const handleToggleDinnerLock = async () => {
    if (!activeDateStr || !isManager) return;
    try {
      setIsLocking('dinner');
      const newStatus = !activeDayLock.isDinnerLocked;

      const res = await fetch('/api/meals/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: activeDateStr,
          isDinnerLocked: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'সমস্যা হয়েছে');

      setActiveDayLock((prev) => ({ ...prev, isDinnerLocked: newStatus }));
      setDailyLocks((prev) => ({
        ...prev,
        [activeDateStr]: {
          ...(prev[activeDateStr] || { isLunchLocked: false, isDinnerLocked: false }),
          isDinnerLocked: newStatus,
        },
      }));

      setModalMessage({
        text: newStatus ? '🔒 রাতের মিল লক করা হয়েছে' : '🔓 রাতের মিল আনলক করা হয়েছে',
        type: 'success',
      });
      setTimeout(() => setModalMessage(null), 3000);
    } catch (err: any) {
      setModalMessage({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsLocking(null);
    }
  };

  // Manager: Mark Cooked for this date
  const handleMarkCooked = async (mealType: 'lunch' | 'dinner') => {
    if (!activeDateStr || !isManager) return;
    const banglaName = mealType === 'lunch' ? 'দুপুরের' : 'রাতের';

    if (!confirm(`আপনি কি নিশ্চিত যে ${activeDateStr} তারিখের ${banglaName} রান্না সম্পন্ন হয়েছে?\n(রান্না সম্পন্ন হলে এই মিল আর কেউ এডিট করতে পারবে না এবং মেসের হিসেবে ফাইনাল হবে)`)) {
      return;
    }

    try {
      setIsLocking(`cooked_${mealType}`);
      const res = await fetch('/api/meals/cooked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: activeDateStr, mealType, isCooked: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'রান্না সম্পন্ন চিহ্নিত করা যায়নি');

      if (mealType === 'lunch') {
        setActiveMeal((prev) => ({ ...prev, isLunchCooked: true }));
        setActiveDayLock((prev) => ({ ...prev, isLunchLocked: true }));
      } else {
        setActiveMeal((prev) => ({ ...prev, isDinnerCooked: true }));
        setActiveDayLock((prev) => ({ ...prev, isDinnerLocked: true }));
      }

      fetchMonthData();
      setModalMessage({ text: `✅ ${banglaName} রান্না সম্পন্ন হয়েছে!`, type: 'success' });
      setTimeout(() => setModalMessage(null), 3000);
    } catch (err: any) {
      setModalMessage({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsLocking(null);
    }
  };

  const handleSaveMeal = async () => {
    if (!activeDateStr) return;
    const targetId = isManager ? selectedUserId : currentUser?.id;
    if (!targetId) return;

    try {
      setIsSaving(true);
      setModalMessage(null);

      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetId,
          date: activeDateStr,
          lunch: activeMeal.lunch,
          dinner: activeMeal.dinner,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'মিল সেভ ব্যর্থ হয়েছে');
      }

      setModalMessage({
        text: `✅ মিল সংরক্ষিত হয়েছে (${data.meal?.updatedTime || 'এখনই'})`,
        type: 'success',
      });

      setMeals((prev) => {
        const filtered = prev.filter((m) => m.date !== activeDateStr);
        return [...filtered, data.meal];
      });

      setTimeout(() => {
        setActiveDateStr(null);
        setModalMessage(null);
      }, 1200);
    } catch (err: any) {
      setModalMessage({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedMemberObj = allMembers.find((m) => m.id === (isManager ? selectedUserId : currentUser?.id));

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                {getBanglaMonthName(month)} {toBanglaNumber(year)}
              </h2>
              <p className="text-[11px] text-slate-400">
                {isManager ? 'সবার মিল ক্যালেন্ডার ও তারিখভিত্তিক লক' : 'আপনার মিল ক্যালেন্ডার'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const now = getBangladeshDateTime();
                setCurrentDate(new Date(now.year, now.month - 1, now.day));
              }}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700/60 active:scale-95"
            >
              আজ
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Member Selector: ONLY SHOWN TO MANAGER! */}
        {isManager && allMembers.length > 0 && (
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-amber-400 font-semibold shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> মেম্বার নির্বাচন:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {allMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedUserId(m.id)}
                  className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    m.id === selectedUserId
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m.name.split(' ')[0]} {m.id === currentUser?.id ? '(আপনি)' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'].map((d, i) => (
          <div
            key={d}
            className={`text-[11px] font-bold py-1 ${
              i === 5 ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[64px] rounded-xl bg-slate-900/20 border border-slate-900/40" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayStr = day.toString().padStart(2, '0');
          const dateStr = `${year}-${monthStr}-${dayStr}`;
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const meal = meals.find((m) => m.date === dateStr);
          const totalDayMeals = meal ? (meal.lunch + meal.dinner) : 0;
          const isCookedDay = meal ? (meal.isLunchCooked && meal.isDinnerCooked) : false;

          const dateLock = dailyLocks[dateStr];
          const isLunchLocked = Boolean(dateLock?.isLunchLocked || (isToday && defaultLunchLocked));
          const isDinnerLocked = Boolean(dateLock?.isDinnerLocked || (isToday && defaultDinnerLocked));
          const isFullyLocked = (isLunchLocked && isDinnerLocked) || isCookedDay;

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={`min-h-[64px] rounded-xl p-1.5 flex flex-col justify-between text-left transition-all border ${
                isToday
                  ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 to-slate-900/90 shadow-md ring-1 ring-amber-400/50'
                  : isCookedDay
                  ? 'border-emerald-500/40 bg-emerald-950/20'
                  : totalDayMeals > 0
                  ? 'border-slate-700 bg-slate-900/70'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-bold ${
                    isToday ? 'text-amber-300' : isPast ? 'text-slate-400' : 'text-slate-200'
                  }`}
                >
                  {toBanglaNumber(day)}
                </span>
                {isCookedDay ? (
                  <span title="রান্না সম্পন্ন">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                  </span>
                ) : isFullyLocked ? (
                  <Lock className="w-2.5 h-2.5 text-rose-400" />
                ) : isLunchLocked ? (
                  <span className="text-[8px] text-amber-400 font-bold">☀️🔒</span>
                ) : isDinnerLocked ? (
                  <span className="text-[8px] text-blue-400 font-bold">🌙🔒</span>
                ) : null}

                {isToday && (
                  <span className="text-[8px] bg-amber-500/30 text-amber-200 font-bold px-1 rounded">
                    আজ
                  </span>
                )}
              </div>

              <div className="mt-1">
                {totalDayMeals > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[11px] font-extrabold ${isCookedDay ? 'text-emerald-300' : 'text-slate-300'}`}>
                      {toBanglaNumber(totalDayMeals)} মিল
                    </span>
                    <div className="flex items-center gap-1 text-[8px] text-slate-400">
                      <span>☀️ {toBanglaNumber(meal?.lunch || 0)}</span>
                      <span>🌙 {toBanglaNumber(meal?.dinner || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-600 font-medium">-</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day Edit & Manager Date-Lock Modal */}
      {activeDateStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-5 border border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveDateStr(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            {/* Title */}
            <div className="mb-3">
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                {isManager ? 'তারিখের মোট মিল ও মেম্বার বিবরণ' : selectedMemberObj?.name || 'মেম্বার'}
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📅 {toBanglaNumber(activeDateStr.split('-')[2])}{' '}
                {getBanglaMonthName(parseInt(activeDateStr.split('-')[1]) - 1)}{' '}
                {toBanglaNumber(activeDateStr.split('-')[0])}
              </h3>
            </div>

            {/* 📊 ম্যানেজার অনলি: মেসের মোট দুপুর ও রাতের মিল (সিম্পল ও ছোট) */}
            {isManager && (
              <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-slate-900/90 border border-amber-500/30 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> মেসের মোট মিল (সবার)
                  </span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    মোট: {isLoadingDateMeals ? '...' : toBanglaNumber(dateMembersMeals.reduce((acc, m) => acc + (m.lunch || 0) + (m.dinner || 0), 0))} টি
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-slate-900/90 py-1.5 px-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
                    <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> দুপুর
                    </span>
                    <span className="text-base font-black text-white">
                      {isLoadingDateMeals ? '...' : toBanglaNumber(dateMembersMeals.reduce((acc, m) => acc + (m.lunch || 0), 0))} <span className="text-[10px] font-normal text-slate-400">টি</span>
                    </span>
                  </div>

                  <div className="bg-slate-900/90 py-1.5 px-2.5 rounded-xl border border-blue-500/20 flex items-center justify-between">
                    <span className="text-xs text-blue-300 font-bold flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-blue-400" /> রাত
                    </span>
                    <span className="text-base font-black text-white">
                      {isLoadingDateMeals ? '...' : toBanglaNumber(dateMembersMeals.reduce((acc, m) => acc + (m.dinner || 0), 0))} <span className="text-[10px] font-normal text-slate-400">টি</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 👑 MANAGER SPECIFIC: PER-DATE LOCK & COOKED BUTTONS */}
            {isManager && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ম্যানেজার কন্ট্রোল (এই তারিখের জন্য)
                  </span>
                  <span className="text-[10px] text-slate-400">লক/আনলক</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* ☀️ Lunch Lock Button for this date */}
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                      <Sun className="w-3 h-3" /> দুপুর
                    </div>
                    {activeMeal.isLunchCooked ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                        ✓ রান্না শেষ
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 w-full">
                        <button
                          type="button"
                          onClick={handleToggleLunchLock}
                          disabled={isLocking === 'lunch'}
                          className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                            activeDayLock.isLunchLocked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {activeDayLock.isLunchLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                          <span>{activeDayLock.isLunchLocked ? 'লকড (আনলক)' : 'লক করুন'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkCooked('lunch')}
                          disabled={isLocking === 'cooked_lunch'}
                          className="w-full py-1 px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" /> রান্না শেষ
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🌙 Dinner Lock Button for this date */}
                  <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-300">
                      <Moon className="w-3 h-3" /> রাত
                    </div>
                    {activeMeal.isDinnerCooked ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                        ✓ রান্না শেষ
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 w-full">
                        <button
                          type="button"
                          onClick={handleToggleDinnerLock}
                          disabled={isLocking === 'dinner'}
                          className={`w-full py-1 px-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                            activeDayLock.isDinnerLocked
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {activeDayLock.isDinnerLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                          <span>{activeDayLock.isDinnerLocked ? 'লকড (আনলক)' : 'লক করুন'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkCooked('dinner')}
                          disabled={isLocking === 'cooked_dinner'}
                          className="w-full py-1 px-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" /> রান্না শেষ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cooked warnings for member */}
            {(activeMeal.isLunchCooked || activeMeal.isDinnerCooked) && (
              <div className="mb-3 p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  রান্না সম্পন্ন হয়ে গেছে। রান্না হওয়া মিল ম্যানেজার সহ কেউ এডিট করতে পারবেন না।
                </span>
              </div>
            )}

            {/* Timestamp */}
            {activeMeal.updatedTime && (
              <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>সর্বশেষ আপডেট: <strong>{activeMeal.updatedTime}</strong></span>
              </div>
            )}

            {/* Meal Inputs: Lunch & Dinner */}
            <div className="space-y-3 mb-4">
              {/* Lunch */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>দুপুরের মিল</span>
                  {activeMeal.isLunchCooked ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-500/30">রান্না শেষ</span>
                  ) : isLunchLockedForDate(activeDateStr) ? (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isLunchLockedForDate(activeDateStr) || activeMeal.lunch <= 0}
                    onClick={() =>
                      setActiveMeal((prev) => ({
                        ...prev,
                        lunch: Math.max(0, prev.lunch - 1),
                      }))
                    }
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 border border-slate-700/60 active:scale-90 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-black text-lg text-white">
                    {toBanglaNumber(activeMeal.lunch)}
                  </span>
                  <button
                    disabled={isLunchLockedForDate(activeDateStr)}
                    onClick={() =>
                      setActiveMeal((prev) => ({
                        ...prev,
                        lunch: prev.lunch + 1,
                      }))
                    }
                    className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white active:scale-90 transition-all shadow-md shadow-emerald-600/30 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dinner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span>রাতের মিল</span>
                  {activeMeal.isDinnerCooked ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold border border-emerald-500/30">রান্না শেষ</span>
                  ) : isDinnerLockedForDate(activeDateStr) ? (
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={isDinnerLockedForDate(activeDateStr) || activeMeal.dinner <= 0}
                    onClick={() =>
                      setActiveMeal((prev) => ({
                        ...prev,
                        dinner: Math.max(0, prev.dinner - 1),
                      }))
                    }
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-slate-200 border border-slate-700/60 active:scale-90 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-black text-lg text-white">
                    {toBanglaNumber(activeMeal.dinner)}
                  </span>
                  <button
                    disabled={isDinnerLockedForDate(activeDateStr)}
                    onClick={() =>
                      setActiveMeal((prev) => ({
                        ...prev,
                        dinner: prev.dinner + 1,
                      }))
                    }
                    className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center text-white active:scale-90 transition-all shadow-md shadow-emerald-600/30 font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-2 mb-4">
              <span className="text-slate-400 font-medium">মোট মিল:</span>
              <strong className="text-emerald-300 font-bold text-sm">
                {toBanglaNumber(activeMeal.lunch + activeMeal.dinner)} টি
              </strong>
            </div>

            {modalMessage && (
              <div
                className={`mb-3 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                  modalMessage.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {modalMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{modalMessage.text}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveDateStr(null)}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700/60"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                disabled={isSaving || (isLunchLockedForDate(activeDateStr) && isDinnerLockedForDate(activeDateStr))}
                onClick={handleSaveMeal}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'মিল সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
