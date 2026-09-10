# 🚀 Vercel ও Free Database ডিপ্লয়মেন্ট গাইড (Bangla Deployment Guide)

এই মেস ক্যালকুলেশন প্রজেক্টটি ১০০% ফ্রিতে **Vercel** এ ডিপ্লয় করা এবং ফ্রিতে **Neon PostgreSQL** ডাটাবেজ যুক্ত করার সহজ নিয়ম নিচে দেওয়া হলো:

---

## ধাপ ১: ফ্রি PostgreSQL ডাটাবেজ তৈরি (Neon.tech)

১. [Neon.tech](https://neon.tech) ওয়েবসাইটে গিয়ে বিনামূল্যে সাইন আপ করুন।
২. একটি নতুন প্রোজেক্ট তৈরি করুন (যেমন: `mess-database`)।
৩. আপনাকে একটি **Connection String / Database URL** দেওয়া হবে। দেখতে নিচের মতো হবে:
   ```env
   DATABASE_URL="postgresql://neondb_owner:xxxxxx@ep-cool-mess-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```
৪. এটি কপি করে রাখুন।

---

## ধাপ ২: প্রজেক্টে PostgreSQL সক্রিয় করা

`prisma/schema.prisma` ফাইলে `provider` লাইনটি পরিবর্তন করুন:

```prisma
datasource db {
  provider = "postgresql" // "sqlite" এর বদলে "postgresql" লিখুন
  url      = env("DATABASE_URL")
}
```

এবং আপনার `.env` ফাইলে Neon থেকে পাওয়া `DATABASE_URL` বসান:
```env
DATABASE_URL="postgresql://neondb_owner:xxxxxx@ep-cool-mess-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="mess_calculation_super_secret_jwt_key_2026_vercell_free"
```

ডাটাবেজে টেবিল ও ডেমো ডাটা তৈরি করতে টার্মিনালে রান করুন:
```bash
npx prisma db push
node prisma/seed.js
```

---

## ধাপ ৩: GitHub এ কোড পুশ করা

১. আপনার GitHub এ একটি নতুন রিপোজিটরি (Repository) তৈরি করুন।
২. আপনার টার্মিনালে রান করুন:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for mess calculation app"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo-name.git
   git push -u origin main
   ```

---

## ধাপ ৪: Vercel-এ ডিপ্লয় করা

১. [Vercel.com](https://vercel.com) এ লগইন করুন।
২. **Add New...** -> **Project** এ ক্লিক করে আপনার GitHub রিপোজিটরিটি সিলেক্ট করুন।
3. **Environment Variables** সেকশনে নিচের ২টি ভ্যারিয়েবল যোগ করুন:
   - `DATABASE_URL` = আপনার Neon PostgreSQL URL
   - `JWT_SECRET` = যেকোনো সিক্রেট কী (যেমন: `mess_secret_key_2026`)
৪. **Deploy** বাটনে ক্লিক করুন!

🎉 **অভিনন্দন! আপনার মেস ক্যালকুলেশন অ্যাপ সম্পূর্ণ ফ্রিতে লাইভ হয়ে যাবে।**
