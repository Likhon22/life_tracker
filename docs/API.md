# API Reference

All routes live under `src/app/api/`. Every route (except NextAuth's own handler) follows the same pattern:

```ts
const session = await getServerSession(authOptions);
if (!session || !session.user?.id) return 401;
await connectToDatabase();
// ...query scoped to { userId: session.user.id }
```

There is no shared middleware/wrapper for this — it's repeated by hand in every route file. `session.user.id` is the Google OAuth `sub` claim (see `src/app/api/auth/[...nextauth]/route.ts`), and every Mongoose document that stores user data has a `userId` field indexed on it and filtered on in every query. This is how cross-user data isolation is enforced — there is no separate authorization layer beyond "does this document's `userId` match the session".

`proxy.ts` (Next middleware) additionally gates page routes `/dashboard`, `/settings`, `/goals`, `/finance` — but **not** `/habits` or `/investments`. This is inconsistent; those two pages rely entirely on client-side session gating (`ModulePage` renders `AuthScreen` instead of content when unauthenticated). It is not a data-security hole — every API route independently checks the session — but it means an unauthenticated visitor briefly reaches the page shell for `/habits` and `/investments` before the client redirects to the sign-in screen, where `/goals` and `/finance` never do. Worth aligning the matcher list if the inconsistency matters to you.

---

## Auth

### `GET/POST /api/auth/[...nextauth]`
NextAuth.js Google OAuth handler. JWT session strategy, 7-day expiry. Additionally rate-limited: 20 requests/minute per IP (`x-forwarded-for` header, falls back to `"anonymous"` if absent — meaning behind a proxy that doesn't set this header, all traffic shares one bucket).

---

## Habits

### `GET /api/habits`
Returns the signed-in user's habits, sorted by `order` then `createdAt`. **Side effect**: if the user has zero habits, seeds 3 defaults ("To Do list", "Exercise", "Read") and returns those instead. This means the first-ever load always writes to the DB.

### `POST /api/habits`
Body: `{ name: string }`. Case-insensitive duplicate-name check per user. New habit gets `order = current habit count` (appended to the end).

### `PUT /api/habits/:id`
Body: `{ name: string }`. Same duplicate check, excluding the habit being renamed.

### `DELETE /api/habits/:id`
Deletes the habit, then `$pull`s its ID out of every `DailyRecord.habitIds` for that user (cleans up history references).

### `POST /api/habits/reorder`
Body: `{ habitIds: string[] }`. Sets each habit's `order` to its index in the array via `Promise.all` of individual `findOneAndUpdate` calls (N writes, not batched — acceptable at typical habit-list sizes of a few dozen).

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

## Data Models (`src/models/index.ts`)

All models live in one file. Every schema uses a `toJSON` transform that strips `_id` and exposes a virtual `id: string` instead — the frontend never sees raw Mongo ObjectIds.

| Model | Key fields | Notes |
|---|---|---|
| `Habit` | `name, userId, order` | |
| `DailyRecord` | `date, userId, habitIds[]` | Unique compound index `{ date, userId }` |
| `DailyGoal` | `text, completed, date, userId, order` | |
| `FinanceBudget` | `userId, month, amount` | Unique compound index `{ userId, month }` |
| `FinanceCategory` | `userId, name, icon` | |
| `FinanceExpense` | `userId, date, month, amount, categoryId, note?` | `month` is a denormalized copy of `date`'s year-month, indexed separately for fast month filtering |
| `FinanceFixedCost` | `userId, month, name, amount` | |
| `InvestmentCategory` | `userId, name, icon` | |
| `Investment` | `userId, name, categoryId, note?` | |
| `InvestmentTransaction` | `userId, investmentId, type, amount, date, note?` | |

**Removed**: the `Resume` model (AI Resume Architect feature) was deleted along with its API routes, components, and Gemini integration — it was unrelated to the app's actual purpose (life/habit tracking) and is gone entirely, not just hidden.

---

## Rate limiting

`src/lib/rateLimit.ts` is an **in-memory** `Map`-based limiter — it resets on every server restart and does not share state across multiple server instances or serverless function invocations. Fine for a single long-running Node process; if this app is ever deployed to a serverless/multi-instance platform (e.g. Vercel with concurrent function instances), the rate limits become approximate at best, since each instance has its own map. Used on: NextAuth handler (20/min/IP).
