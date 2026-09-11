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

// Get Date & Time in Bangladesh Timezone (Asia/Dhaka, UTC+6)
export function getBangladeshDateTime(date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
  dateStr: string; // YYYY-MM-DD
  monthStr: string; // YYYY-MM
} {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '00';

  const year = parseInt(getPart('year'), 10);
  const month = parseInt(getPart('month'), 10);
  const day = parseInt(getPart('day'), 10);
  let hours = parseInt(getPart('hour'), 10);
  if (hours === 24) hours = 0;
  const minutes = parseInt(getPart('minute'), 10);
  const seconds = parseInt(getPart('second'), 10);

  const monthPadded = month.toString().padStart(2, '0');
  const dayPadded = day.toString().padStart(2, '0');

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dateStr: `${year}-${monthPadded}-${dayPadded}`,
    monthStr: `${year}-${monthPadded}`,
  };
}

// Format timestamp strictly in Bangladesh Time (Asia/Dhaka): e.g. "১১ সেপ্টেম্বর, রাত ০৮:৩০"
export function getFormattedBanglaTimestamp(dateObj = new Date()): string {
  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  
  const { month, day, hours, minutes } = getBangladeshDateTime(dateObj);
  const monthName = monthsBn[month - 1] || '';
  
  let period = 'সকাল';
  if (hours >= 12 && hours < 15) period = 'দুপুর';
  else if (hours >= 15 && hours < 18) period = 'বিকাল';
  else if (hours >= 18 && hours < 20) period = 'সন্ধ্যা';
  else if (hours >= 20 || hours < 6) period = 'রাত';

  const hour12 = hours % 12 || 12;
  const minPadded = minutes.toString().padStart(2, '0');
  return `${toBanglaNumber(day)} ${monthName}, ${period} ${toBanglaNumber(hour12)}:${toBanglaNumber(minPadded)}`;
}

// Format Date string YYYY-MM-DD in Bangladesh Time
export function getTodayDateString(): string {
  return getBangladeshDateTime().dateStr;
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
