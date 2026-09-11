import type { Metadata, Viewport } from 'next';
import { Hind_Siliguri, Inter } from 'next/font/google';
import './globals.css';

const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali', 'latin'],
  display: 'swap',
  variable: '--font-hind',
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'মেস মিল ক্যালকুলেশন | Mess Meal Manager',
  description: 'সহজে মেসের মিল, বাজার খরচ ও মিল রেট হিসাব করার আধুনিক মোবাইল ফ্রেন্ডলি অ্যাপ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'মেস ক্যালকুলেটর',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b1320',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`dark ${hindSiliguri.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen selection:bg-emerald-500 selection:text-white pb-safe font-bangla text-slate-100 bg-[#0b1320]">
        {children}
      </body>
    </html>
  );
}
