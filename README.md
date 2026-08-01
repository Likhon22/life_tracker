# Life Tracker 🚀

A premium, all-in-one life tracking application built with **Next.js 16**, **TypeScript**, and **MongoDB**. Designed with a sleek, Notion-style aesthetic, this tool helps you stay on top of your habits, goals, finances, and investments in one place.

For deeper reference docs, see:
- [`docs/API.md`](docs/API.md) — every backend route, model, and auth/rate-limit rule
- [`docs/FRONTEND.md`](docs/FRONTEND.md) — folder structure, component tree, state/caching strategy
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — issues found, fixes applied, and what's still recommended

## ✨ Current Features

### 📅 Habit Tracking
- Interactive daily habit grid with drag-and-drop reordering (`@dnd-kit`)
- Monthly history view, per-habit and daily completion-rate analytics
- Optimistic UI with automatic rollback on failure

### 🎯 Daily Goals
- One-off, date-scoped to-do list separate from recurring habits
- 7-day + tomorrow navigation strip, automatic rollover of incomplete goals into "today"

### 💰 Finance Center
- Monthly budgets, categorized expenses, and recurring fixed costs
- One-click "import fixed costs from previous month"
- Daily spending bar chart + category breakdown pie chart (Recharts)
- Inline calculator syntax in amount fields (e.g. `5600+100`)

### 📈 Investment Tracker
- Category "folders" (crypto, stocks, business, etc.) containing multiple assets
- Per-asset invest/withdraw transaction history with running P&L
- Portfolio-wide and per-category totals

### 🔒 Secure Multi-User System
- Google Authentication (NextAuth.js)
- Every record is scoped to the signed-in user's ID — no cross-user data leakage
- Server-side session checks on every API route, independent of UI-level gating

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS v4
- **Data fetching / caching**: TanStack Query (`useQuery`/`useMutation`, optimistic updates, cache invalidation)
- **Backend**: Next.js API Routes (App Router), Mongoose
- **Database**: MongoDB Atlas
- **Authentication**: NextAuth.js (Google OAuth)
- **Charts**: Recharts
- **Drag & drop**: `@dnd-kit`
- **Icons & UI**: Lucide React, small internal UI primitive kit (`src/components/ui`)

---

## 📁 Project Structure

```
src/
  app/                  # Next.js App Router — pages + API routes
    api/                # habits, records, goals, finance/*, investments/*, auth
    habits|goals|finance|investments/page.tsx
  components/
    ui/                 # Button, IconButton, Input, Select, Card — shared primitives
    layout/             # Sidebar, BottomNav, ModulePage
    auth/                # AuthProvider, AuthScreen
    providers/          # QueryProvider (TanStack Query root)
    habits/ goals/ finance/ investments/   # feature-scoped components + data hooks
  lib/                  # mongodb, rateLimit, utils, confirmToast
  models/                # single Mongoose schema file (all collections)
```

Each feature folder (`habits/`, `goals/`, `finance/`, `investments/`) owns its own data-fetching logic — either a Provider (Context + React Query) for state shared across many components, or a `useX` hook for a single page. See [`docs/FRONTEND.md`](docs/FRONTEND.md) for the full breakdown.

---

## 🗺️ Roadmap (Upcoming Features)

- [ ] **🔔 Reminders**: Browser/mobile notifications to keep you consistent
- [ ] **📤 Advanced Export**: Download data as PDF or CSV
- [ ] **📊 Investment performance charts**: portfolio value over time

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB database
- Google OAuth credentials (for sign-in)

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

### 5. Useful scripts
```bash
npm run build   # production build
npm run lint    # eslint
```
`scripts/` also has one-off maintenance scripts (`fix-db.ts`, `wipe.ts`, `seed-user-habits.ts`, `cleanup-user-data.ts`) run via `npx tsx scripts/<name>.ts`.

---

## 📄 License
MIT © [Likhon22](https://github.com/Likhon22)
