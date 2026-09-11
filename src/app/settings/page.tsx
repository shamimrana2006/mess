'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BanglaLoader from '@/components/BanglaLoader';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { Settings, User, Phone, Lock, Save, CheckCircle2, AlertCircle, Sun, Moon, Flame, ShieldCheck, ShieldAlert, RotateCcw, Trash2 } from 'lucide-react';
import { UserSession, MessDashboardData } from '@/lib/types';
import { formatTaka } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [dashboardData, setDashboardData] = useState<MessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Mess Settings State (For Manager)
  const [messName, setMessName] = useState('');
  const [fixedCosts, setFixedCosts] = useState('0');
  const [cutoffTime, setCutoffTime] = useState('10:00');
  const [isLunchLocked, setIsLunchLocked] = useState(false);
  const [isDinnerLocked, setIsDinnerLocked] = useState(false);
  const [lockPastDays, setLockPastDays] = useState(true);
  const [isSavingMessSettings, setIsSavingMessSettings] = useState(false);
  const [messSettingsSuccess, setMessSettingsSuccess] = useState(false);

  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';

  // Admin Reset State
  const [resetModalAction, setResetModalAction] = useState<'reset_meals_bazar' | 'full_reset' | 'reset_month' | null>(null);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(userData.user);
      setProfileName(userData.user.name || '');
      setProfilePhone(userData.user.phone || '');

      const summaryRes = await fetch('/api/summary');
      const summaryData = await summaryRes.json();
      setDashboardData(summaryData);

      if (summaryData.settings) {
        setMessName(summaryData.settings.messName || 'আমাদের মেস');
        setFixedCosts(summaryData.settings.fixedCosts?.toString() || '0');
        setCutoffTime(summaryData.settings.cutoffTime || '10:00');
        setIsLunchLocked(summaryData.settings.isLunchLocked || false);
        setIsDinnerLocked(summaryData.settings.isDinnerLocked || false);
        setLockPastDays(summaryData.settings.lockPastDays ?? true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Handle Profile Update (Name, Phone, Password)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (newPassword && newPassword.length < 6) {
      setProfileMessage({ text: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে', type: 'error' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMessage({ text: 'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মেলেনি', type: 'error' });
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentUser(data.user);
      setProfileMessage({ text: data.message || '✅ প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!', type: 'success' });
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // 2. Handle Mess Settings Update (Manager Only)
  const handleSaveMessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    try {
      setIsSavingMessSettings(true);
      setMessSettingsSuccess(false);

      const res = await fetch('/api/meals/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messName,
          fixedCosts: Number(fixedCosts),
          cutoffTime,
          isLunchLocked,
          isDinnerLocked,
          lockPastDays,
        }),
      });

      if (!res.ok) throw new Error('মেস সেটিংস আপডেট ব্যর্থ');

      setMessSettingsSuccess(true);
      setTimeout(() => setMessSettingsSuccess(false), 3000);
      loadData();
    } catch (err) {
      alert('সমস্যা হয়েছে');
    } finally {
      setIsSavingMessSettings(false);
    }
  };

  // 3. Handle Super Admin Data Reset
  const handleExecuteAdminReset = async () => {
    if (!resetModalAction) return;

    if (resetModalAction === 'full_reset' && resetConfirmInput.trim().toUpperCase() !== 'RESET') {
      alert('সতর্কতা: সম্পূর্ণ রিসেট করতে ইংরেজি বড় হাতের অক্ষরে "RESET" লিখুন।');
      return;
    }

    try {
      setIsResetting(true);
      setResetFeedback(null);

      const currentMonthStr = dashboardData?.todayDate?.slice(0, 7);

      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: resetModalAction,
          month: currentMonthStr,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'ডাটা রিসেট ব্যর্থ হয়েছে');
      }

      setResetFeedback({ text: data.message || 'ডাটা রিসেট সম্পন্ন হয়েছে!', type: 'success' });
      setResetModalAction(null);
      setResetConfirmInput('');
      loadData();
    } catch (err: any) {
      setResetFeedback({ text: err.message || 'সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !dashboardData) {
    return <BanglaLoader message="সেটিংস লোড হচ্ছে ...." />;
  }

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col">
      <Navbar
        user={currentUser}
        isLunchLocked={dashboardData.settings.isLunchLocked}
        isDinnerLocked={dashboardData.settings.isDinnerLocked}
        messName={dashboardData.settings.messName}
      />

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* CARD 1: প্রোফাইল সেটিংস (সকলের জন্য: নাম, ফোন ও পাসওয়ার্ড পরিবর্তন) */}
        <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/20 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">আপনার প্রোফাইল সেটিংস</h2>
              <p className="text-[11px] text-slate-400">নাম, ফোন নম্বর ও পাসওয়ার্ড পরিবর্তন করুন</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                আপনার নাম
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Email (Read only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                ইমেইল একাউন্ট (পরিবর্তনযোগ্য নয়)
              </label>
              <input
                type="text"
                value={currentUser?.email || ''}
                disabled
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ফোন নম্বর
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password Change Box (Optional) */}
            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-200 block">
                পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)
              </span>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  বর্তমান পাসওয়ার্ড
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="বর্তমান পাসওয়ার্ড দিন"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    নতুন পাসওয়ার্ড
                  </label>
                  <input
                    type="password"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    কনফার্ম পাসওয়ার্ড
                  </label>
                  <input
                    type="password"
                    placeholder="পুনরায় লিখুন"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল তথ্য সংরক্ষণ করুন'}
            </button>
          </form>
        </div>

        {/* CARD 2: মেস সেটিংস ও নিয়মাবলি (ম্যানেজারের জন্য বা মেম্বার ইনফো) */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">মেস সেটিংস ও নিয়মাবলি</h2>
              <p className="text-[11px] text-slate-400">মেসের নাম, খালার বিল ও লক নিয়ম</p>
            </div>
          </div>

          {!isManager ? (
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2.5">
              <p className="text-slate-300">
                🔒 আপনি মেসের সদস্য। মেস সেটিংস পরিবর্তন শুধুমাত্র ম্যানেজার করতে পারেন।
              </p>
              <div className="pt-2 border-t border-slate-800 space-y-2 text-slate-400">
                <div className="flex justify-between">
                  <span>মেসের নাম:</span>
                  <strong className="text-white">{dashboardData.settings.messName}</strong>
                </div>
                <div className="flex justify-between">
                  <span>খালার বিল / ফিক্সড খরচ:</span>
                  <strong className="text-white">{formatTaka(dashboardData.settings.fixedCosts)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveMessSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  মেসের নাম
                </label>
                <input
                  type="text"
                  value={messName}
                  onChange={(e) => setMessName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  খালার বিল / গ্যাস বিল / অন্যান্য ফিক্সড খরচ (৳)
                </label>
                <input
                  type="number"
                  value={fixedCosts}
                  onChange={(e) => setFixedCosts(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  এই খরচটি মেম্বারদের মধ্যে সমানভাবে ভাগ হবে
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> গ্লোবাল লক রুলস
                </h4>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs text-slate-300">
                    পূর্ববর্তী দিনের মিল এডিট বন্ধ রাখুন
                  </span>
                  <input
                    type="checkbox"
                    checked={lockPastDays}
                    onChange={(e) => setLockPastDays(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                </label>
              </div>

              {messSettingsSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>মেস সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingMessSettings}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSavingMessSettings ? 'সংরক্ষণ হচ্ছে...' : 'মেস সেটিংস সংরক্ষণ করুন'}
              </button>
            </form>
          )}
        </div>

        {/* CARD 3: সুপার এডমিন ডেটা রিসেট জোন (ADMIN ONLY) */}
        {isAdmin && (
          <div className="glass-card rounded-2xl p-4 border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900/90 to-slate-900 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>সুপার এডমিন কন্ট্রোল ও রিসেট প্যানেল</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.2 rounded-full border border-purple-500/40">
                    ADMIN ONLY
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">মেসের ডেটা আংশিক বা সম্পূর্ণ ফ্যাক্টরি রিসেট করুন</p>
              </div>
            </div>

            {resetFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {resetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{resetFeedback.text}</span>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              {/* Option 1: Reset Meals & Bazar only */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">সব মিল ও বাজার খরচ রিসেট</h4>
                  <p className="text-[10px] text-slate-400">সকল মিল ও বাজার ডিলিট হবে, মেম্বার অ্যাকাউন্ট অক্ষত থাকবে</p>
                </div>
                <button
                  onClick={() => {
                    setResetModalAction('reset_meals_bazar');
                    setResetConfirmInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" /> রিসেট
                </button>
              </div>

              {/* Option 2: Reset current month only */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">চলতি মাসের হিসাব রিসেট</h4>
                  <p className="text-[10px] text-slate-400">শুধুমাত্র বর্তমান মাসের মিল ও বাজার খরচ শূন্য হবে</p>
                </div>
                <button
                  onClick={() => {
                    setResetModalAction('reset_month');
                    setResetConfirmInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1 shrink-0 transition-all active:scale-95"
                >
                  <RotateCcw className="w-3 h-3" /> মাস রিসেট
                </button>
              </div>

              {/* Option 3: Full Factory Reset */}
              <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-rose-300">সম্পূর্ণ মেস সিস্টেম ফ্যাক্টরি রিসেট</h4>
                  <p className="text-[10px] text-rose-400/80">সকল মিল, বাজার ও জমা শূন্য হয়ে ফ্রেশ শুরু হবে</p>
                </div>
                <button
                  onClick={() => {
                    setResetModalAction('full_reset');
                    setResetConfirmInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-all shadow-md shadow-rose-600/30 active:scale-95"
                >
                  <Trash2 className="w-3 h-3" /> ফুল রিসেট
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADMIN RESET CONFIRMATION MODAL */}
        {resetModalAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-sm rounded-3xl p-5 border border-rose-500/40 shadow-2xl relative space-y-4">
              <button
                onClick={() => {
                  setResetModalAction(null);
                  setResetConfirmInput('');
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>

              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {resetModalAction === 'full_reset'
                      ? '⚠️ সম্পূর্ণ সিস্টেম রিসেট নিশ্চিতকরণ'
                      : resetModalAction === 'reset_month'
                      ? '⚠️ চলতি মাস রিসেট নিশ্চিতকরণ'
                      : '⚠️ মিল ও বাজার হিসাব রিসেট নিশ্চিতকরণ'}
                  </h3>
                  <p className="text-[11px] text-slate-400">এই পরিবর্তনটি আর পূর্বাবস্থায় ফেরানো যাবে না</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                {resetModalAction === 'full_reset' ? (
                  <>
                    <p className="text-rose-300 font-bold">💥 আপনি সম্পূর্ণ সিস্টেম ফ্যাক্টরি রিসেট করতে যাচ্ছেন!</p>
                    <p>সকল মিল রেকর্ড, বাজার খরচ এবং জমা শূন্য হয়ে যাবে।</p>
                    <p className="pt-2 text-slate-400">নিশ্চিত করতে নিচে ইংরেজি বড় অক্ষরে <strong className="text-rose-400 font-mono">RESET</strong> টাইপ করুন:</p>
                  </>
                ) : resetModalAction === 'reset_month' ? (
                  <p>চলতি মাসের সকল মিল ও বাজারের হিসাব শূন্য হয়ে যাবে। আপনি কি নিশ্চিত?</p>
                ) : (
                  <p>সকল মিল ও বাজারের খরচ মুছে ফেলা হবে। মেম্বার অ্যাকাউন্ট অপরিবর্তিত থাকবে। আপনি কি নিশ্চিত?</p>
                )}
              </div>

              {resetModalAction === 'full_reset' && (
                <input
                  type="text"
                  placeholder='RESET টাইপ করুন'
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  className="w-full bg-slate-900 border border-rose-500/40 rounded-xl px-3 py-2 text-center text-sm font-mono tracking-widest text-rose-300 uppercase focus:outline-none focus:border-rose-400"
                />
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetModalAction(null);
                    setResetConfirmInput('');
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isResetting || (resetModalAction === 'full_reset' && resetConfirmInput.trim().toUpperCase() !== 'RESET')}
                  onClick={handleExecuteAdminReset}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 disabled:opacity-40 transition-all"
                >
                  {isResetting ? 'রিসেট হচ্ছে...' : 'হ্যাঁ, রিসেট করুন'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
