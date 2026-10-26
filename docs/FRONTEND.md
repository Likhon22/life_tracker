# Frontend Architecture

## Folder structure

```
src/components/
  ui/            Button, IconButton, Input, Select, Card + CardHeader
                 — shared style primitives, no feature knowledge
  layout/        Sidebar, BottomNav, ModulePage
                 — app chrome, rendered from the root layout
  auth/          AuthProvider (NextAuth SessionProvider wrapper), AuthScreen
                 — the "sign in with Google" gate shown by ModulePage
  providers/     QueryProvider
                 — wraps the app in a TanStack Query QueryClientProvider
  habits/        HabitProvider (Context + React Query), HabitList,
                 AnalyticsSidebar, PerformanceChart, CategorySelect,
                 HabitCategoryManager
  goals/         DailyGoals (owns its own React Query hooks directly, no Provider)
  finance/       FinanceProvider (Context + React Query) + 7 presentational
                 components (BudgetSummary, AddExpense, CategoryManager,
                 FinanceCharts, FixedCosts, MonthSelector, RecentExpenses)
  investments/   useInvestments (plain hook, no Context) + SummaryCard,
                 AddCategoryForm, CategoryFolder, InvestmentAssetCard,
                 TransactionRow, types.ts
  cigarettes/    CigaretteProvider (Context + React Query), LogEntryForm,
                 BrandSelect, BrandManager, CigaretteStats, LogList
```

Before this reorganization, every component lived flat in `src/components/` regardless of feature, and `investments/page.tsx` was a single 716-line file with all state, all data fetching, and all JSX inline — no sub-components at all. That's fixed now; every feature folder mirrors the `finance/` pattern that already existed.

## Two data-access patterns, and when each is used

**Context Provider** (`HabitProvider`, `FinanceProvider`): used when *many* sibling components across a page need the same server data and mutation functions — e.g. every finance component reads `useFinance()` for the current month's budget/expenses/categories. The provider wraps the React Query calls and exposes a stable function-based API (`addExpense`, `updateBudget`, etc.) so consumers never touch `fetch` or query keys directly.

**Plain hook** (`useInvestments`, and `DailyGoals`'s inline queries): used when only *one* page/component tree needs the data and there's no value in a Context — skips a layer of indirection.

Both patterns are now backed by **TanStack Query** (`@tanstack/react-query`), wired up in `src/components/providers/QueryProvider.tsx` and mounted once in the root layout. Before this, it was installed in `package.json` and never imported anywhere — every provider hand-rolled `useEffect` + `fetch` + `useState`, with **zero caching**: every mount refetched from scratch, and every mutation refetched the entire dataset instead of updating the cache directly.

What React Query buys here concretely:
- **Caching**: revisiting a page (e.g. navigating away from `/finance` and back) within the 60s `staleTime` window serves cached data instantly instead of re-fetching.
- **Deduplication**: if two components request the same query key in the same render pass, only one network call happens.
- **Optimistic updates with rollback**: mutations like toggling a habit or a goal update the cache immediately (`onMutate`) and roll back automatically (`onError`) if the server call fails — previously this rollback logic was either missing or manual.
- **Scoped invalidation**: e.g. adding an investment transaction invalidates only `["investments", "list"]`, not the whole app.

## Query key conventions

| Feature | Keys |
|---|---|
| Habits | `["habits"]`, `["records"]`, `["habitCategories"]` |
| Finance | `["finance", "budget", month]`, `["finance", "categories"]`, `["finance", "expenses", month]`, `["finance", "fixed-costs", month]` |
| Investments | `["investments", "categories"]`, `["investments", "list"]` |
| Goals | `["goals", date]` |
| Cigarettes | `["cigaretteBrands"]`, `["cigaretteLogs", month]` |

Finance and Goals keys include the selected month/date, so switching months/dates is a **cache key change**, not a manual refetch — previously revisiting a month always re-fetched even if you'd been there seconds ago; now it's instant if cached.

## UI primitives (`src/components/ui`)

Before this pass, every button/input/card was hand-styled inline with the same Tailwind class strings copy-pasted across 15+ files (`bg-[#191919] border border-[#2d2d2d] rounded-2xl p-6 shadow-xl` for cards, `bg-blue-600 hover:bg-blue-500 text-white ... rounded-xl` for primary buttons, etc.). Five primitives now capture the recurring patterns:

- `Button` — variants `primary | secondary | danger | ghost`, sizes `sm | md`
- `IconButton` — square icon-only button, tones `default | danger | primary | success`
- `Input` — text input, optional built-in label
- `Select` — native select, optional built-in label
- `Card` / `CardHeader` — the dark bordered-card container + icon+title header row used everywhere

**Applied so far**: the entire `investments/` feature (built fresh with these), and `HabitList`'s delete confirmation. **Not yet migrated**: `finance/*` and `goals/DailyGoals.tsx` still use their original hand-written markup — they were left alone to limit the size/risk of this change, since retrofitting ~15 files each with multiple button/input instances is a larger, separate pass. They're straightforward candidates for the same primitives when you're ready.

**Not using `Select`**: habit-category and cigarette-brand pickers (`habits/CategorySelect.tsx`, `cigarettes/BrandSelect.tsx`) deliberately skip the native `<select>` — browsers render its open option list with no CSS control, which looked out of place next to the rest of the dark UI. Both are small custom dropdowns (button + absolutely-positioned list, click-outside/Escape to close) duplicated across the two files rather than shared, since this is only the 2nd occurrence and the two have different row content (icon+name vs. name+price). Worth collapsing into one generic component if a 3rd picker like this shows up.

## `confirmToast` (`src/lib/confirmToast.tsx`)

The "Delete this?" confirmation toast (cancel/delete buttons, same styling) was duplicated near-verbatim in `HabitList`, and twice in the old `investments/page.tsx`. Extracted into one function: `confirmToast({ message, description?, confirmLabel?, onConfirm })`. Used in `HabitList`, `InvestmentAssetCard`, and `CategoryFolder`.

## Component-level state relaxations (investments module)

The original `investments/page.tsx` kept "which transaction is being edited", "which investment has its history open", "which investment has an add-transaction form open", and "which investment is being edited" all as **page-level singleton state** — meaning only one of these could be open anywhere on the page at a time, even across unrelated category folders.

In the rebuilt version, `TransactionRow` and `InvestmentAssetCard` each own this state locally. Practical effect: you can now, for example, have two different assets' transaction-add forms open at once. This is a deliberate relaxation, not a bug — it's what naturally falls out of components being self-contained instead of coordinated through page-level state, and it removes an arbitrary restriction rather than introducing one.

## Habit categories

Every habit belongs to a `HabitCategory` (`categoryId`, required). `AnalyticsSidebar` groups habits under their category's header instead of one flat list — each header shows the category's aggregate completion % (average of its habits' own rates, not pooled completions/possible — chosen so a brand-new habit in a category doesn't drag the number down disproportionately) plus a month-over-month ▲/▼ delta. Per-habit rows are unchanged underneath. `PerformanceChart` gets a third "By Category" tab: a horizontal bar per category, colored by the same red/yellow/green/blue tiers as the circular progress rings (`<40` / `40-69` / `≥70` / `100`), sorted best-to-worst.

Category CRUD (`HabitCategoryManager`, opened from a gear icon in `AnalyticsSidebar`'s header) mirrors `finance/CategoryManager.tsx`. Deleting a category is blocked (400) while it still has habits, same safety pattern as Investment category deletion.

A one-off migration (`scripts/categorize-habits.ts`) bulk-assigned every pre-existing habit into the 9 default categories by exact name match, so no habit was left without a `categoryId` when the field became required.

## Cigarette tracker ↔ Finance link

`cigarettes/CigaretteProvider.tsx` is a self-contained feature (own brands + logs, own stats computed client-side via `useMemo` over the fetched logs), but a log creates a `FinanceExpense` under the user's "Cigarettes" category whenever `paidBySelf` is true — the API does this server-side (`src/lib/cigaretteSync.ts`), not the frontend, so the link survives even if the cigarette log is later edited or deleted directly in the DB. The frontend never has to reconcile two sources of truth for cost; it just shows the logs and lets Finance's own queries pick up the resulting expenses on their own next fetch.

`consumedBySelf` (who smoked it) and `paidBySelf` (who paid) are independent fields — a friend can cover your bill, or you can cover theirs. Consumption stats (`todaySelfCount`, `monthSelfCount`, the daily trend chart) are keyed on `consumedBySelf`; cost stats (`todayCost`, `monthCost`, per-brand cost) are keyed on `paidBySelf`. A log where a friend paid still counts toward your sticks smoked, never toward your cost. Editing a log can flip `paidBySelf` in either direction, so `PUT /api/cigarettes/logs/:id` has to create, sync, or delete the linked expense depending on the before/after state — see `docs/API.md`.

## Known remaining inefficiencies (not fixed, listed for visibility)

- `HabitProvider.getHabitCompletionRate` / `getDailyCompletionRate` / `getCategoryCompletionRate` are plain functions recomputed on every call (not memoized). At typical habit-list sizes (a few dozen) this is negligible, but if habit counts grow large, wrapping the per-habit rate calculation in `useMemo` keyed on `[habits, records]` would avoid recomputation on unrelated re-renders.
- `proxy.ts` middleware matcher doesn't include `/habits`, `/investments`, or `/cigarettes` (see `docs/API.md`) — inconsistent with `/goals` and `/finance`, though not a security gap since API routes independently check the session.
- `finance/*` and `goals/DailyGoals.tsx` haven't been migrated to the `ui/` primitives yet (see above).
- `CategorySelect` and `BrandSelect` duplicate the same click-outside/Escape dropdown mechanics (see "Not using `Select`" above) — fine at 2 occurrences, a candidate to extract if a 3rd shows up.
