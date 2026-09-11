export type UserRole = 'MANAGER' | 'MEMBER';
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
  netBalance: number; // deposit + bazarContributed - mealCost
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
  stats: {
    totalMessMeals: number; // Only cooked meals
    todayTotalMeals: number;
    totalBazarExpense: number;
    mealRate: number;
    totalDeposits: number;
    activeMembersCount: number;
  };
  members: MemberSummary[];
  todayDate: string;
}
