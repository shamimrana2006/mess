import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert English digits to Bengali digits
export function toBanglaNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '০';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const str = typeof num === 'number' ? (Number.isInteger(num) ? num.toString() : num.toFixed(2)) : num.toString();
  return str.replace(/[0-9]/g, (digit) => banglaDigits[parseInt(digit, 10)]);
}

// Format Taka currency in Bengali format
export function formatTaka(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount).toFixed(2);
  const formatted = toBanglaNumber(absAmount);
  return `${isNegative ? '-' : ''}৳ ${formatted}`;
}

// Format timestamp: e.g. "11 Sep, 08:30 PM" or "১১ সেপ্টেম্বর, রাত ০৮:৩০"
export function getFormattedBanglaTimestamp(dateObj = new Date()): string {
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  
  const day = dateObj.getDate();
  const month = monthsBn[dateObj.getMonth()];
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  let period = 'সকাল';
  if (hours >= 12 && hours < 15) period = 'দুপুর';
  else if (hours >= 15 && hours < 18) period = 'বিকাল';
  else if (hours >= 18 && hours < 20) period = 'সন্ধ্যা';
  else if (hours >= 20 || hours < 6) period = 'রাত';

  const hour12 = hours % 12 || 12;
  return `${toBanglaNumber(day)} ${month}, ${period} ${toBanglaNumber(hour12)}:${toBanglaNumber(minutes)}`;
}

// Format Date string YYYY-MM-DD
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get Bengali Month Name
export function getBanglaMonthName(monthIndex: number): string {
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  return monthsBn[monthIndex] || '';
}

// Get Day of Week in Bengali
export function getBanglaDayName(dayIndex: number): string {
  const daysBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
  return daysBn[dayIndex] || '';
}

// Generate direct WhatsApp link
export function getWhatsAppLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }
  return `https://wa.me/${cleaned}`;
}
