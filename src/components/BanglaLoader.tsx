'use client';

import React from 'react';
import { Utensils, Flame, Sparkles } from 'lucide-react';

interface BanglaLoaderProps {
  message?: string;
  subMessage?: string;
}

export default function BanglaLoader({
  message = 'নতুন মিল খোঁজা হচ্ছে ....',
  subMessage = 'ডাটাবেজ থেকে মেসের সকল তথ্য লোড করা হচ্ছে',
}: BanglaLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b1320] px-6 text-center select-none">
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Main Animated Cooking Graphic */}
      <div className="relative mb-8 flex flex-col items-center">
        {/* Steam effects */}
        <div className="flex gap-2 mb-1">
          <div className="w-1.5 h-6 bg-gradient-to-t from-emerald-400/80 to-transparent rounded-full animate-steam" />
          <div className="w-2 h-8 bg-gradient-to-t from-emerald-300/80 to-transparent rounded-full animate-steam-delayed" />
          <div className="w-1.5 h-6 bg-gradient-to-t from-emerald-400/80 to-transparent rounded-full animate-steam" />
        </div>

        {/* Central Glowing Circle & Cooking Pot/Utensil */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-900/40 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
          <div className="absolute inset-0 rounded-3xl border border-emerald-400/40 animate-ping opacity-25" />
          
          <div className="relative flex items-center justify-center">
            <Utensils className="w-10 h-10 text-emerald-400 animate-bounce-soft" />
            <Sparkles className="w-4 h-4 text-amber-400 absolute -top-2 -right-2 animate-spin-slow" />
          </div>
        </div>

        {/* Small Flame Base */}
        <div className="flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span>মেস রান্নাঘর রেডি</span>
        </div>
      </div>

      {/* Primary Bangla Loading Text - as requested */}
      <h2 className="text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-white mb-2">
        {message}
      </h2>

      {/* Secondary message */}
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        {subMessage}
      </p>

      {/* Progress Bar / Dots */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
      </div>
    </div>
  );
}
