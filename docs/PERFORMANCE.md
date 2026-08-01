# Performance, Caching & Code Quality Audit

Full read-through of every source file in the repo (70 files: all API routes, all components, all lib/models/scripts). This doc records what was found, what was fixed, and what's still worth doing.

## Fixed

### 1. N+1 query — `GET /api/investments`
**Before**: fetched all investments, then inside a `Promise.all(investments.map(...))` ran a separate `InvestmentTransaction.find()` per investment. N investments → N+1 total DB round trips.
**After**: one `InvestmentTransaction.find({ investmentId: { $in: investmentIds } })`, grouped into a `Map<investmentId, transactions[]>` in memory. Always exactly 2 queries regardless of investment count.
**File**: `src/app/api/investments/route.ts`

### 2. Dead/broken code — `fixed-costs/route.ts`
- `GET` had two consecutive `return NextResponse.json(fixedCosts)` statements — the second was unreachable dead code.
- `PUT` was an empty function body with only comments (`// I'll add the [id] dynamic route... to be consistent`) — a stub that was never filled in, since `[id]/route.ts` already implements `PUT` correctly. Removed the dead stub.
**File**: `src/app/api/finance/fixed-costs/route.ts`

### 3. TanStack Query was installed but completely unused
`@tanstack/react-query@5.90.21` was in `package.json`, but zero `useQuery`/`useMutation`/`QueryClientProvider` calls existed anywhere. Every data-fetching component/provider (`HabitProvider`, `FinanceProvider`, `investments/page.tsx`, `DailyGoals`) hand-rolled `useEffect` + `fetch` + `useState`, meaning:
- No caching — every mount re-fetched from the network, even revisiting a page you'd just left.
- No deduplication.
- Every mutation triggered either a full manual re-fetch of everything, or a hand-written optimistic update with no standard rollback path.

**Fixed**: added `QueryProvider` at the root layout, converted `HabitProvider`, `FinanceProvider`, `useInvestments` (new), and `DailyGoals` to `useQuery`/`useMutation` with proper cache keys, optimistic updates + rollback, and scoped invalidation. See `docs/FRONTEND.md` for the query-key table and the caching behavior this actually buys.

### 4. Investments page: O(n × m) filtering on every render
**Before**: `investments/page.tsx` did `investments.filter(inv => categoryIdOf(inv) === cat.id)` once *per category, per render* — for C categories and I investments, that's C passes over the full I-length array every single render.
**After**: one `useMemo` groups all investments into a `Map<categoryId, investments[]>` in a single O(I) pass whenever the `investments` array changes; each `CategoryFolder` just reads its own bucket via `map.get(cat.id)`.
**File**: `src/app/investments/page.tsx`

### 5. Investments page: 716-line monolith → 8 small files
No sub-components existed at all — one file owned every piece of state (13+ `useState` calls), every fetch call, and every JSX block for categories, assets, transaction forms, and transaction history, all deeply nested. Split into `useInvestments.ts` (data hook), `types.ts`, `SummaryCard`, `AddCategoryForm`, `CategoryFolder`, `InvestmentAssetCard`, `TransactionRow`, and a ~100-line page that just wires them together. See `docs/FRONTEND.md` for the state-ownership tradeoffs this introduced (in a good way — see "Component-level state relaxations").

### 6. Repeated UI markup → shared primitives
`Button`, `IconButton`, `Input`, `Select`, `Card`/`CardHeader` extracted to `src/components/ui/`. The delete-confirmation toast (identical ~25-line block duplicated in `HabitList` and twice in the old investments page) became one `confirmToast()` helper in `src/lib/confirmToast.tsx`.

### 7. Dead code removal — AI Resume Architect feature
Entirely unrelated to a life/habit tracker: an AI-powered LaTeX résumé generator using Gemini. Removed completely, not just hidden:
- `src/app/resumes/`, `src/app/api/resumes/**` (4 route files)
- `src/components/ResumeCard.tsx`, `AICVOptimizer.tsx`
- `src/lib/gemini.ts`, `src/lib/gemini/**`, `src/lib/prompts/**`
- `src/lib/masterTemplates.ts` — a 192-line file of hardcoded LaTeX templates that, on inspection, was **already dead code before this cleanup**: nothing imported it, not even the résumé feature itself.
- `scripts/test-gemini.ts`
- `Resume` model + `IResume` interface from `src/models/index.ts`
- The `@google/generative-ai` dependency from `package.json`
- All nav references (Sidebar, BottomNav, dashboard card)

### 8. Folder structure — feature-based reorganization
Every component used to live flat in `src/components/`, mixing layout chrome, auth, and every feature together. Reorganized into `ui/`, `layout/`, `auth/`, `providers/`, `habits/`, `goals/`, `finance/`, `investments/` — see `docs/FRONTEND.md` for the full tree. `finance/` already followed this pattern before the change; everything else didn't.

---

## Remaining recommendations (not applied — listed for visibility, not urgent)

These weren't fixed because they're either low-impact at the app's current scale, or a larger/riskier change than seemed proportionate to bundle into this pass. Flagging them so you can prioritize:

1. **`finance/*` and `goals/DailyGoals.tsx` still use hand-written buttons/inputs/cards**, not the new `ui/` primitives. Mechanical migration, same pattern as `investments/`, but touches ~8 files with several instances each.
2. **`proxy.ts` middleware matcher is inconsistent**: protects `/goals` and `/finance` but not `/habits` or `/investments`. Not a security hole (every API route checks the session independently), just an inconsistency in the middleware list.
3. **In-memory rate limiter** (`src/lib/rateLimit.ts`) resets on server restart and doesn't share state across multiple instances — fine for a single Node process, would need a shared store (Redis, etc.) if deployed to a multi-instance/serverless platform with meaningful traffic.
4. **`HabitProvider`'s completion-rate calculations aren't memoized** — recomputed on every call. Negligible at typical habit-list sizes; worth a `useMemo` if habit counts grow much larger.
5. **`habits/reorder` and category-folder deletes issue N individual writes** (`Promise.all` of per-document updates) rather than a single bulk operation (e.g. Mongoose `bulkWrite`). Fine at typical list sizes (tens of items), would matter more at hundreds+.
6. **`package.json`'s `mongoose` version (`^9.2.3`)** — worth double-checking this is intentional; Mongoose's stable major at time of writing is 8.x. Not something to change without confirming it's not a typo, since it wasn't part of what broke.

## Also cleaned up

- Deleted 5 unreferenced default Next.js boilerplate SVGs from `public/` (`vercel.svg`, `file.svg`, `globe.svg`, `next.svg`, `window.svg`) — confirmed unused via grep before removal.
