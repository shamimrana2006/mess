'use client';

import React from 'react';
import { Utensils, TrendingUp, ShoppingCart, PieChart, CheckCircle2 } from 'lucide-react';
import { toBanglaNumber, formatTaka } from '@/lib/utils';
import { MessDashboardData } from '@/lib/types';

interface DashboardStatsProps {
  stats: MessDashboardData['stats'];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* 1. Monthly Total Cooked Meals */}
      <div className="glass-card rounded-2xl p-3.5 border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> রান্না সম্পন্ন মিল
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {toBanglaNumber(stats.totalMessMeals)}
          </span>
          <span className="text-xs text-emerald-400/80 font-medium">টি</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">মাসের মোট রান্না হওয়া মিল</p>
      </div>

      {/* 2. Live Meal Rate */}
      <div className="glass-card rounded-2xl p-3.5 border border-amber-500/20 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-900/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-amber-300">বর্তমান মিল রেট</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {formatTaka(stats.mealRate)}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          মোট বাজার ÷ রান্না মিল
        </p>
      </div>

      {/* 3. Today's Cooked Meals */}
      <div className="glass-card rounded-2xl p-3.5 border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-slate-900/60 to-slate-900/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-blue-300">আজকের রান্না মিল</span>
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Utensils className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {toBanglaNumber(stats.todayTotalMeals)}
          </span>
          <span className="text-xs text-blue-400/80 font-medium">টি</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {toBanglaNumber(stats.activeMembersCount)} জন মেম্বার
        </p>
      </div>

      {/* 4. Total Monthly Bazar Expense */}
      <div className="glass-card rounded-2xl p-3.5 border border-purple-500/20 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-slate-900/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-purple-300">মোট বাজার খরচ</span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-white tracking-tight">
            {formatTaka(stats.totalBazarExpense)}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">চলতি মাসের মোট বাজার</p>
      </div>
    </div>
  );
}
