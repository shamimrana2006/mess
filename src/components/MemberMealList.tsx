'use client';

import React, { useState } from 'react';
import { Users, Phone, ShieldCheck, ArrowUpRight, ArrowDownRight, Sun, Moon } from 'lucide-react';
import { toBanglaNumber, formatTaka } from '@/lib/utils';
import { MemberSummary, UserSession } from '@/lib/types';

interface MemberMealListProps {
  members: MemberSummary[];
  currentUser: UserSession | null;
  mealRate: number;
}

export default function MemberMealList({
  members,
  currentUser,
  mealRate,
}: MemberMealListProps) {
  const [selectedMember, setSelectedMember] = useState<MemberSummary | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-100">
            কার কয়টা মিল আছে (মেম্বার তালিকা)
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          মোট: <strong className="text-emerald-400">{toBanglaNumber(members.length)}</strong> জন
        </span>
      </div>

      {/* Member List Cards */}
      <div className="space-y-2.5">
        {members.map((member) => {
          const isCurrentUser = currentUser?.id === member.id;
          const isPositive = member.netBalance > 0;
          const isDue = member.netBalance < 0;

          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              className={`glass-card glass-card-hover rounded-2xl p-3.5 cursor-pointer border transition-all ${
                isCurrentUser
                  ? 'border-emerald-500/40 bg-slate-900/90 shadow-md shadow-emerald-950/40'
                  : 'border-slate-800 bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Avatar & Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-inner ${
                      member.role === 'MANAGER'
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950'
                        : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                    }`}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-slate-100 truncate max-w-[130px]">
                        {member.name}
                      </h4>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.2 rounded">
                          আপনি
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>
                        আজ: <strong className="text-slate-200">{toBanglaNumber(member.todayMeals)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        মোট: <strong className="text-emerald-400 font-bold">{toBanglaNumber(member.totalMeals)}</strong> মিল
                      </span>
                    </div>
                  </div>
                </div>

                {/* Net Balance Pill */}
                <div className="text-right">
                  <div className="text-xs font-semibold">
                    {isPositive ? (
                      <span className="text-emerald-400 inline-flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <ArrowUpRight className="w-3 h-3" /> পাবে {formatTaka(member.netBalance)}
                      </span>
                    ) : isDue ? (
                      <span className="text-rose-400 inline-flex items-center gap-0.5 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        <ArrowDownRight className="w-3 h-3" /> দিবে {formatTaka(Math.abs(member.netBalance))}
                      </span>
                    ) : (
                      <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        সমান
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    খরচ: {formatTaka(member.mealCost)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-5 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                  selectedMember.role === 'MANAGER'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {selectedMember.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  {selectedMember.name}
                  {selectedMember.role === 'MANAGER' && (
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  )}
                </h3>
                <p className="text-xs text-slate-400">{selectedMember.email}</p>
                {selectedMember.phone && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-emerald-400" /> {selectedMember.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Meal Breakdown: Lunch & Dinner */}
            <div className="bg-slate-900/90 rounded-2xl p-3 border border-slate-800 mb-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                মিল ব্রেকডাউন (চলতি মাস)
              </h4>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-800/60 p-2.5 rounded-xl flex flex-col items-center">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> দুপুর
                  </span>
                  <p className="text-base font-bold text-slate-200 mt-1">
                    {toBanglaNumber(selectedMember.mealsCount.lunch)} টি
                  </p>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded-xl flex flex-col items-center">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-blue-400" /> রাত
                  </span>
                  <p className="text-base font-bold text-slate-200 mt-1">
                    {toBanglaNumber(selectedMember.mealsCount.dinner)} টি
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex justify-between text-xs">
                <span className="text-slate-400">মোট মিল:</span>
                <strong className="text-emerald-400 text-sm">
                  {toBanglaNumber(selectedMember.totalMeals)} টি
                </strong>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">জমা দিয়েছেন:</span>
                <strong className="text-white">{formatTaka(selectedMember.deposit)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">বাজার করেছেন:</span>
                <strong className="text-white">{formatTaka(selectedMember.bazarContributed)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">মিল খরচ ({toBanglaNumber(selectedMember.totalMeals)} × {formatTaka(mealRate)}):</span>
                <strong className="text-rose-300">{formatTaka(selectedMember.mealCost)}</strong>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                <span>বর্তমান ব্যালেন্স:</span>
                <span className={selectedMember.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedMember.netBalance >= 0
                    ? `পাবে ${formatTaka(selectedMember.netBalance)}`
                    : `দিবে ${formatTaka(Math.abs(selectedMember.netBalance))}`}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedMember(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-all"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
