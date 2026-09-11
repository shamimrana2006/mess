'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BanglaLoader from '@/components/BanglaLoader';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import MealCalendar from '@/components/MealCalendar';
import { UserSession, MessDashboardData } from '@/lib/types';

export default function CalendarPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [dashboardData, setDashboardData] = useState<MessDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (!userData.user) {
        router.push('/login');
        return;
      }
      if (userData.user.status === 'PENDING' && userData.user.role !== 'MANAGER') {
        router.push('/');
        return;
      }
      setCurrentUser(userData.user);

      const summaryRes = await fetch('/api/summary');
      const summaryData = await summaryRes.json();
      setDashboardData(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading || !dashboardData) {
    return <BanglaLoader message="মিল ক্যালেন্ডার লোড হচ্ছে ...." />;
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
        <MealCalendar
          currentUser={currentUser}
          allMembers={dashboardData.members}
          isLunchLocked={dashboardData.settings.isLunchLocked}
          isDinnerLocked={dashboardData.settings.isDinnerLocked}
          lockPastDays={dashboardData.settings.lockPastDays}
        />
      </main>

      <BottomNav />
    </div>
  );
}
