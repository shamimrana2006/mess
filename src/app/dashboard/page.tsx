'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BanglaLoader from '@/components/BanglaLoader';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import DashboardStats from '@/components/DashboardStats';
import TodayQuickAction from '@/components/TodayQuickAction';
import MemberMealList from '@/components/MemberMealList';
import ManagerLockToggle from '@/components/ManagerLockToggle';
import { Sun, Moon, Flame } from 'lucide-react';
import { toBanglaNumber } from '@/lib/utils';
import { UserSession, MessDashboardData } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [dashboardData, setDashboardData] = useState<MessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();

      if (!userData.user) {
        router.push('/login');
        return;
      }

      setCurrentUser(userData.user);

      const summaryRes = await fetch('/api/summary');
      const summaryData = await summaryRes.json();

      setDashboardData(summaryData);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 700);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading || !dashboardData) {
    return <BanglaLoader message="মেসের হিসাব খোঁজা হচ্ছে ...." />;
  }

  // If user is pending manager approval
  if (currentUser && currentUser.status === 'PENDING' && currentUser.role !== 'MANAGER') {
    return (
      <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center items-center px-4 py-8 text-center">
        <div className="glass-card w-full rounded-3xl p-6 border border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-amber-950/20 shadow-2xl space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <span className="text-3xl">⏳</span>
          </div>

          <div>
            <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30 uppercase tracking-wider">
              অপেক্ষমাণ মেম্বার
            </span>
            <h2 className="text-lg font-black text-white mt-3">
              অ্যাকাউন্টটি অনুমোদনের অপেক্ষায় রয়েছে
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              প্রিয় <strong className="text-amber-300">{currentUser.name}</strong>, আপনার রেজিস্ট্রেশন সম্পন্ন হয়েছে। মেসের ম্যানেজার অনুমোদন (Approve) করলেই আপনি মেসের মিল ও হিসাব দেখতে পারবেন।
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p>মেসের নাম: <strong className="text-slate-200">{dashboardData.settings.messName}</strong></p>
            <p>ইমেইল: <strong className="text-slate-200">{currentUser.email}</strong></p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={fetchDashboard}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              🔄 স্ট্যাটাস রিফ্রেশ করুন
            </button>

            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
              }}
              className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold active:scale-95 transition-all"
            >
              🚪 লগআউট
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        isLunchLocked={dashboardData.settings.isLunchLocked}
        isDinnerLocked={dashboardData.settings.isDinnerLocked}
        messName={dashboardData.settings.messName}
        onRefresh={fetchDashboard}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4">
        {/* 👑 মেসের আজকের মোট মিল (শুধুমাত্র ম্যানেজার ও এডমিন দেখতে পারবে) */}
        {isManager && dashboardData.todayMessMeals && (
          <div className="glass-card rounded-2xl p-3 border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-900/90 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> আজকের মেসের মোট মিল
              </span>
              <span className="text-[11px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/30">
                মোট: {toBanglaNumber(dashboardData.todayMessMeals.total)} টি
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-900/90 py-1.5 px-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> দুপুর
                </span>
                <span className="text-base font-black text-white">
                  {toBanglaNumber(dashboardData.todayMessMeals.lunch)} <span className="text-[10px] font-normal text-slate-400">টি</span>
                </span>
              </div>
              <div className="bg-slate-900/90 py-1.5 px-2.5 rounded-xl border border-blue-500/20 flex items-center justify-between">
                <span className="text-xs text-blue-300 font-bold flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-blue-400" /> রাত
                </span>
                <span className="text-base font-black text-white">
                  {toBanglaNumber(dashboardData.todayMessMeals.dinner)} <span className="text-[10px] font-normal text-slate-400">টি</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 1. Manager Meal Lock & 'রান্না শেষ' Widget (Only for Manager & Admin) */}
        {isManager && (
          <ManagerLockToggle
            isLunchLocked={dashboardData.settings.isLunchLocked}
            isDinnerLocked={dashboardData.settings.isDinnerLocked}
            todayCookedStatus={dashboardData.todayCookedStatus}
            onToggleSuccess={fetchDashboard}
          />
        )}

        {/* 2. Today's Quick Action Card (Lunch and Dinner) - ONLY FOR EATING MEMBERS & MANAGERS, NOT ADMIN */}
        {!isAdmin && (
          <TodayQuickAction
            user={currentUser}
            isLunchLocked={dashboardData.settings.isLunchLocked}
            isDinnerLocked={dashboardData.settings.isDinnerLocked}
            todayCookedStatus={dashboardData.todayCookedStatus}
            onMealUpdated={fetchDashboard}
          />
        )}

        {/* 3. Dashboard Statistics Cards (Calculated based on Cooked Meals) */}
        <DashboardStats stats={dashboardData.stats} />

        {/* 4. Member Meal Breakdown ("কার কয়টা মিল আছে") */}
        <MemberMealList
          members={dashboardData.members}
          currentUser={currentUser}
          mealRate={dashboardData.stats.mealRate}
        />
      </main>

      <BottomNav />
    </div>
  );
}
