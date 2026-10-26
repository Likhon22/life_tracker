# API Reference

All routes live under `src/app/api/`. Every route (except NextAuth's own handler) follows the same pattern:

```ts
const session = await getServerSession(authOptions);
if (!session || !session.user?.id) return 401;
await connectToDatabase();
// ...query scoped to { userId: session.user.id }
```

There is no shared middleware/wrapper for this — it's repeated by hand in every route file. `session.user.id` is the Google OAuth `sub` claim (see `src/app/api/auth/[...nextauth]/route.ts`), and every Mongoose document that stores user data has a `userId` field indexed on it and filtered on in every query. This is how cross-user data isolation is enforced — there is no separate authorization layer beyond "does this document's `userId` match the session".

`proxy.ts` (Next middleware) additionally gates page routes `/dashboard`, `/settings`, `/goals`, `/finance` — but **not** `/habits`, `/investments`, or `/cigarettes`. This is inconsistent; those pages rely entirely on client-side session gating (`ModulePage` renders `AuthScreen` instead of content when unauthenticated). It is not a data-security hole — every API route independently checks the session — but it means an unauthenticated visitor briefly reaches the page shell before the client redirects to the sign-in screen, where `/goals` and `/finance` never do. Worth aligning the matcher list if the inconsistency matters to you.

---

## Auth

### `GET/POST /api/auth/[...nextauth]`
NextAuth.js Google OAuth handler. JWT session strategy, 7-day expiry. Additionally rate-limited: 20 requests/minute per IP (`x-forwarded-for` header, falls back to `"anonymous"` if absent — meaning behind a proxy that doesn't set this header, all traffic shares one bucket).

---

## Habits

### `GET /api/habits`
Returns the signed-in user's habits, sorted by `order` then `createdAt`. **Side effect**: if the user has zero habits, seeds 3 defaults ("To Do list", "Exercise", "Read") and returns those instead. This means the first-ever load always writes to the DB.

### `POST /api/habits`
Body: `{ name: string, categoryId: string }`. Case-insensitive duplicate-name check per user. `categoryId` is required. New habit gets `order = current habit count` (appended to the end).

### `PUT /api/habits/:id`
Body: `{ name: string, categoryId?: string }`. Same duplicate check, excluding the habit being renamed. `categoryId` is optional on edit (omit to leave unchanged).

### `DELETE /api/habits/:id`
Deletes the habit, then `$pull`s its ID out of every `DailyRecord.habitIds` for that user (cleans up history references).

### `POST /api/habits/reorder`
Body: `{ habitIds: string[] }`. Sets each habit's `order` to its index in the array via `Promise.all` of individual `findOneAndUpdate` calls (N writes, not batched — acceptable at typical habit-list sizes of a few dozen).

---

## Habit Categories

### `GET /api/habits/categories`
Returns the signed-in user's habit categories, sorted alphabetically. **Side effect**: if the user has zero categories, seeds 9 defaults (Faith, Career, Business, Health, Relationships, Finance, Personal Growth, Self-Care, Productivity) and returns those instead — same seed-on-first-load pattern as Finance/Investment categories. Shared between this route and `GET /api/habits`'s own default-habit seeding via `ensureHabitCategories()` in `src/lib/habitCategories.ts`.

### `POST /api/habits/categories`
Body: `{ name: string, icon: string }`. Case-insensitive duplicate-name check per user.

### `PUT /api/habits/categories/:id`
Body: `{ name: string, icon: string }`. Same duplicate check, excluding the category being renamed.

### `DELETE /api/habits/categories/:id`
400s if any habit still references the category (`Habit.countDocuments({ categoryId })` > 0) — same cascade-safety pattern as Investment category deletion. Move or delete those habits first.

---

## Records (habit completion)

### `GET /api/records?month=YYYY-MM`
Returns `{ "YYYY-MM-DD": ["habitId", ...] }` for the given month (or all records if `month` omitted). One `DailyRecord` document per user per date (unique compound index on `{ date, userId }`).

### `POST /api/records`
Body: `{ date, habitId }`. Toggles: creates a new `DailyRecord` if none exists for that date, otherwise pushes/removes the `habitId` from its `habitIds` array.

---

## Goals

### `GET /api/goals?date=YYYY-MM-DD&localToday=YYYY-MM-DD`
Returns goals for `date`. **Rollover side effect**: if `date === localToday`, any incomplete goal with `date < localToday` gets its `date` bumped forward to `localToday` — this is how "yesterday's unfinished goals" silently become "today's goals" without an explicit user action.

### `POST /api/goals`
Body: `{ text, date }`. New goal's `order` is `(max existing order for that date) + 1`.

### `PATCH /api/goals/:id`
Body: partial `{ text?, completed?, order? }` — merged via `$set`.

### `DELETE /api/goals/:id`

---

## Finance

All finance endpoints are month-scoped (`YYYY-MM`) except categories, which are global per user.

### Budget
- `GET /api/finance/budget?month=YYYY-MM` → `{ amount, month }` (defaults to `{ amount: 0, month }` if unset)
- `POST /api/finance/budget` — body `{ month, amount }`, upserts

### Categories
- `GET /api/finance/categories` — seeds 9 defaults (Dinner, Lunch, Breakfast, Groceries, Transportation, Cigarettes, Medicine, Beverages, Adda/Hangout) on first call, same pattern as habits
- `POST /api/finance/categories` — body `{ name, icon }`
- `PUT /api/finance/categories/:id`, `DELETE /api/finance/categories/:id`

### Expenses
- `GET /api/finance/expenses?month=YYYY-MM` — populates `categoryId`, sorted newest first
- `POST /api/finance/expenses` — body `{ date, amount, categoryId, note? }`; `month` is derived server-side from `date.substring(0, 7)`
- `PUT /api/finance/expenses/:id`, `DELETE /api/finance/expenses/:id`

### Fixed Costs
- `GET /api/finance/fixed-costs?month=YYYY-MM`
- `POST /api/finance/fixed-costs` — body `{ month, name, amount }`
- `PUT /api/finance/fixed-costs/:id`, `DELETE /api/finance/fixed-costs/:id`
- `POST /api/finance/fixed-costs/import` — body `{ month }`; finds the most recent past month with fixed costs and clones every entry into the target month. 400s if the target month already has entries, 404s if no past month exists.

---

## Investments

### `GET /api/investments?categoryId=<optional>`
Returns every investment (optionally filtered by category), each with its full transaction list and derived aggregates:
```ts
{
  ...investment, categoryId: { id, name, icon },
  transactions: Transaction[],
  totalInvested, totalWithdrawn, activeCapital, pnl,
  firstEntryDate, latestEntryDate
}
```
Implementation note: this fetches **all** transactions for the user's investments in a single `$in` query and groups them in memory — previously this was one `InvestmentTransaction.find()` per investment inside a `Promise.all` (classic N+1: N investments → N+1 total queries). Now it's always exactly 2 queries regardless of investment count.

### `POST /api/investments`
Body: `{ name, categoryId, note? }`.

### `PUT /api/investments/:id`
Body: `{ name?, note? }`. **Returns the plain updated document — no `transactions`/aggregate fields.** The frontend must not blindly replace its cached copy with this response; it should merge just `name`/`note` and keep the existing aggregates (this is what `useInvestments.ts`'s `updateInvestment` mutation does).

### `DELETE /api/investments/:id`
Also deletes every `InvestmentTransaction` under that investment.

### Investment Categories
- `GET /api/investments/categories`
- `POST /api/investments/categories` — body `{ name, icon }`. **Side effect**: also auto-creates a default "General" investment under the new category. Callers must refetch/invalidate the investments list after this, not just the categories list.
- `DELETE /api/investments/categories/:id` — 400s if any investment in the category has transaction history (must delete those first); otherwise cascades to delete the (empty) investments in that category.

### Transactions
- `POST /api/investments/:id/transactions` — body `{ type: 'invest'|'withdraw', amount, date, note? }`
- `PUT /api/investments/:id/transactions` — body `{ type, amount, date, note? }` (route param here is actually the **transaction** ID, not the investment ID — the file lives at `[id]/transactions/route.ts` but `PUT`/`DELETE` operate on `InvestmentTransaction._id`)
- `DELETE /api/investments/:id/transactions` — same ID caveat

---

## Cigarette Tracker

### Brands
- `GET /api/cigarettes/brands` — seeds 6 defaults (Lucky 12, Benson Light 23, Benson 23, Gold Leaf 18, Camel 10, Marlboro 23 — price per stick) on first call, same seed pattern as Finance/Habit categories
- `POST /api/cigarettes/brands` — body `{ name, pricePerStick }`, case-insensitive duplicate check
- `PUT /api/cigarettes/brands/:id`, `DELETE /api/cigarettes/brands/:id` — delete 400s if any `CigaretteLog` references the brand

### Logs
- `GET /api/cigarettes/logs?month=YYYY-MM` — populates `brandId`, sorted newest first
- `POST /api/cigarettes/logs` — body `{ date, brandId, quantity, amount, consumedBySelf, paidBySelf, note? }`. **`consumedBySelf`** (who smoked it) and **`paidBySelf`** (who paid) are independent — e.g. a friend can cover your bill (`consumedBySelf: true, paidBySelf: false`), or you can cover theirs (`consumedBySelf: false, paidBySelf: true`). **Finance sync**: a `FinanceExpense` is only created when `paidBySelf` is true (it's not your expense otherwise) — under the user's "Cigarettes" `FinanceCategory` (found by name, case-insensitive; auto-created if the user deleted it), `note: "{quantity}x {brandName}"` (` (friend)` suffix when `consumedBySelf` is false), with that expense's ID stored on the log as `financeExpenseId`. See `src/lib/cigaretteSync.ts`.
- `PUT /api/cigarettes/logs/:id` — body is a partial update of the same fields. `paidBySelf` can flip either direction between edits, so the linked expense is created, synced, or deleted to match: true→true syncs it, false→true creates one that never existed, true→false deletes it (and `financeExpenseId` is explicitly `$unset`, not just left `undefined` — an `undefined` value in a plain Mongoose update object is silently dropped, not persisted), false→false is a no-op.
- `DELETE /api/cigarettes/logs/:id` — also deletes the linked `FinanceExpense` if one exists, so cost and log never drift apart.

All three writes run inside a Mongoose `session.withTransaction()` (the DB is MongoDB Atlas, a replica set, so real multi-document transactions are available) — the log write and its `FinanceExpense` write either both commit or neither does. On failure the client gets a static, plain-English error (e.g. "the cost couldn't be recorded in Finance, so nothing was saved"); the real error is only logged server-side, never forwarded to the response.

Consumption stats (self vs. friend sticks) are keyed on `consumedBySelf`; cost stats (today/month/per-brand) are keyed on `paidBySelf` — a friend-paid log still counts toward your sticks but never toward your cost, matching what actually left your pocket.

Consumption stats (today/month self vs. friend counts, per-brand breakdown, daily trend) are computed client-side in `CigaretteProvider` from the fetched logs — there's no separate stats endpoint.

---

## Data Models (`src/models/index.ts`)

All models live in one file. Every schema uses a `toJSON` transform that strips `_id` and exposes a virtual `id: string` instead — the frontend never sees raw Mongo ObjectIds.

| Model | Key fields | Notes |
|---|---|---|
| `Habit` | `name, userId, order, categoryId` | `categoryId` is required, ref `HabitCategory` |
| `HabitCategory` | `userId, name, icon` | |
| `DailyRecord` | `date, userId, habitIds[]` | Unique compound index `{ date, userId }` |
| `DailyGoal` | `text, completed, date, userId, order` | |
| `FinanceBudget` | `userId, month, amount` | Unique compound index `{ userId, month }` |
| `FinanceCategory` | `userId, name, icon` | |
| `FinanceExpense` | `userId, date, month, amount, categoryId, note?` | `month` is a denormalized copy of `date`'s year-month, indexed separately for fast month filtering |
| `FinanceFixedCost` | `userId, month, name, amount` | |
| `InvestmentCategory` | `userId, name, icon` | |
| `Investment` | `userId, name, categoryId, note?` | |
| `InvestmentTransaction` | `userId, investmentId, type, amount, date, note?` | |
| `CigaretteBrand` | `userId, name, pricePerStick` | |
| `CigaretteLog` | `userId, date, brandId, quantity, amount, consumedBySelf, paidBySelf, note?, financeExpenseId?` | `consumedBySelf` (who smoked it) and `paidBySelf` (who paid) are independent; `financeExpenseId` only exists while `paidBySelf` is true, kept in sync on edit/delete |

**Removed**: the `Resume` model (AI Resume Architect feature) was deleted along with its API routes, components, and Gemini integration — it was unrelated to the app's actual purpose (life/habit tracking) and is gone entirely, not just hidden.

---

## Rate limiting

`src/lib/rateLimit.ts` is an **in-memory** `Map`-based limiter — it resets on every server restart and does not share state across multiple server instances or serverless function invocations. Fine for a single long-running Node process; if this app is ever deployed to a serverless/multi-instance platform (e.g. Vercel with concurrent function instances), the rate limits become approximate at best, since each instance has its own map. Used on: NextAuth handler (20/min/IP).
