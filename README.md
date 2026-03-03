# Life Tracker 🚀

A premium, all-in-one life tracking application built with **Next.js 16**, **TypeScript**, and **MongoDB**. Designed with a sleek, Notion-style aesthetic, this tool helps you stay on top of your habits and goals while providing deep insights into your performance.

## ✨ Current Features

### 📅 Advanced Habit Tracking
- **Interactive Habit Grid**: Toggle daily habits with a single click.
- **Drag-and-Drop Reordering**: Organize your habits exactly how you want them using a smooth sortable interface (powered by `@dnd-kit`).
- **Data Persistence**: Your habit order and completion history are saved securely in MongoDB.
- **Real-time Feedback**: Beautiful dark-themed toast notifications for every action (success, errors, and confirmation).

### 🔒 Secure Multi-User System
- **Google Authentication**: Seamless login via Google (NextAuth.js).
- **Data Isolation**: Every user gets their own private workspace. Your habits and records are filtered strictly by your unique User ID.
- **Protected Routes**: Middleware and server-side checks ensure only you can access your data.

### 📊 Deep Analytics
- **Performance Charts**: Visualize your consistency over time with Recharts.
- **Completion Rates**: Automated calculations for daily and individual habit success rates.
- **Responsive Sidebar**: Switch between focus views and analytics effortlessly.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS v4.
- **State Management**: React Context + TanStack Query (React Query).
- **Backend**: Next.js API Routes (App Router), Mongoose.
- **Database**: MongoDB Atlas.
- **Authentication**: NextAuth.js (Google OAuth).
- **Icons & UI**: Lucide React, Glassmorphism, Premium Dark Mode.

---

## 🗺️ Roadmap (Upcoming Features)

The goal of Life Tracker is to become your central hub for personal growth. Coming soon:

- [ ] **💰 Finance Management**: track daily expenses, set budgets, and visualize your spending habits.
- [ ] **📝 Daily To-Do List**: A dedicated task manager for high-priority items that aren't recurring habits.
- [ ] **🎯 Goal Setting**: Define weekly and monthly milestones with progress bars.
- [ ] **🔔 Reminders**: Browser/Mobile notifications to keep you consistent.
- [ ] **📈 Advanced Export**: Download your data in PDF or CSV format.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB Database

### 2. Installation
```bash
git clone https://github.com/Likhon22/life_tracker.git
cd life_tracker
npm install
```

### 3. Environment Variables
Create a `.env.local` file:
```env
MONGODB_URI=your_mongodb_uri
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 📄 License
MIT © [Likhon22](https://github.com/Likhon22)
