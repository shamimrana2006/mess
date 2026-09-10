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
    return <BanglaLoader message="নতুন মিল খোঁজা হচ্ছে ...." />;
  }

  const isManager = currentUser?.role === 'MANAGER';

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
        {/* 1. Manager Meal Lock & 'রান্না শেষ' Widget (Only for Manager) */}
        {isManager && (
          <ManagerLockToggle
            isLunchLocked={dashboardData.settings.isLunchLocked}
            isDinnerLocked={dashboardData.settings.isDinnerLocked}
            todayCookedStatus={dashboardData.todayCookedStatus}
            onToggleSuccess={fetchDashboard}
          />
        )}

        {/* 2. Today's Quick Action Card (Lunch and Dinner) */}
        <TodayQuickAction
          user={currentUser}
          isLunchLocked={dashboardData.settings.isLunchLocked}
          isDinnerLocked={dashboardData.settings.isDinnerLocked}
          todayCookedStatus={dashboardData.todayCookedStatus}
          onMealUpdated={fetchDashboard}
        />

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
