import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="bn" className="dark">
      <body className="antialiased min-h-screen selection:bg-emerald-500 selection:text-white pb-safe">
        {children}
      </body>
    </html>
  );
}
