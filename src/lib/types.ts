export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type UserStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  deposit: number;
}

export interface MealRecord {
  id?: string;
  userId: string;
  userName?: string;
  date: string; // YYYY-MM-DD
  breakfast?: number;
  lunch: number;
  dinner: number;
  total: number;
  isLunchCooked?: boolean;
  isDinnerCooked?: boolean;
  lunchUpdatedTime?: string | null;
  dinnerUpdatedTime?: string | null;
  updatedTime?: string | null;
  isLocked?: boolean;
}

export interface BazarRecord {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  date: string;
  amount: number;
  items: string;
  notes?: string | null;
  createdAt: string;
}

export interface DepositRecord {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  amount: number;
  date: string;
  time?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface MemberSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string | null;
  deposit: number;
  totalMeals: number; // Cooked meals only
  plannedMeals?: number; // Total planned meals
  todayMeals: number;
  bazarContributed: number;
  mealCost: number;
  netBalance: number; // deposit - mealCost (Bazar is spent from main mess fund)
  createdAt?: string;
  mealsCount: {
    lunch: number;
    dinner: number;
  };
}

export interface MessDashboardData {
  settings: {
    messName: string;
    isLunchLocked: boolean;
    isDinnerLocked: boolean;
    lockPastDays: boolean;
    cutoffTime?: string | null;
    fixedCosts: number;
  };
  todayCookedStatus: {
    isLunchCooked: boolean;
    isDinnerCooked: boolean;
  };
  todayMessMeals?: {
    lunch: number;
    dinner: number;
    total: number;
  };
  stats: {
    totalMessMeals: number; // Only cooked meals
    todayTotalMeals: number;
    totalBazarExpense: number;
    mealRate: number;
    totalDeposits: number;
    remainingFund?: number; // Main fund cash remaining
    activeMembersCount: number;
    pendingMembersCount?: number;
  };
  members: MemberSummary[];
  todayDate: string;
}
