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
      <div className="glass-card rounded-2xl p-3.5 border border-emerald-500/25 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> রান্না মিল
          </span>
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <PieChart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tight">
            {toBanglaNumber(stats.totalMessMeals)}
          </span>
          <span className="text-xs text-emerald-300 font-semibold">টি</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">মাসের মোট রান্না মিল</p>
      </div>

      {/* 2. Live Meal Rate */}
      <div className="glass-card rounded-2xl p-3.5 border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-900/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-amber-300">মিল রেট</span>
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tight">
            {formatTaka(stats.mealRate)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          বাজার ÷ রান্না মিল
        </p>
      </div>

      {/* 3. Today's Cooked Meals */}
      <div className="glass-card rounded-2xl p-3.5 border border-blue-500/25 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-900/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-blue-300">আজকের রান্না মিল</span>
          <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
            <Utensils className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tight">
            {toBanglaNumber(stats.todayTotalMeals)}
          </span>
          <span className="text-xs text-blue-300 font-semibold">টি</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          {toBanglaNumber(stats.activeMembersCount)} জন সক্রিয় সদস্য
        </p>
      </div>

      {/* 4. Total Monthly Bazar Expense */}
      <div className="glass-card rounded-2xl p-3.5 border border-purple-500/25 bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-900/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-purple-300">মোট বাজার খরচ</span>
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-white tracking-tight">
            {formatTaka(stats.totalBazarExpense)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">চলতি মাসের মোট বাজার</p>
      </div>
    </div>
  );
}
