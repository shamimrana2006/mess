'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BanglaLoader from '@/components/BanglaLoader';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { Settings, User, Phone, Lock, Save, CheckCircle2, AlertCircle, Sun, Moon, Flame, ShieldCheck } from 'lucide-react';
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

  const isManager = currentUser?.role === 'MANAGER';

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
      </main>

      <BottomNav />
    </div>
  );
}
