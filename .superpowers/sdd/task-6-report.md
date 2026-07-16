# Task 6 Report: Comparison view and chart integration

## What you implemented

- Added `EstimateComparison`, a client-side comparison panel for selected property estimates.
- Integrated a Recharts bar chart showing predicted prices for compared estimates.
- Added comparison summary metrics for highest price, lowest price, and price difference.
- Added a side-by-side comparison table for predicted price and all property feature values.
- Wired the dashboard to call `compareEstimates()` through the existing Next.js proxy helper.
- Added comparison loading state, disabled/enabled button behavior based on selected history count, and comparison error handling.
- Cleared stale comparison results after creating a new estimate.
- Added focused browser API tests for `compareEstimates()`.

## What you tested and exact results

- `cd apps/web-portal && npm run test -- lib/property-estimator/api.test.ts`
  - PASS
  - 1 test file passed
  - 6 tests passed
- `cd apps/web-portal && npm run test`
  - PASS
  - 4 test files passed
  - 32 tests passed
- `cd apps/web-portal && npm run lint`
  - PASS
  - ESLint exited 0 with `--max-warnings=0`
- `cd apps/web-portal && npm run typecheck`
  - PASS
  - `tsc --noEmit` exited 0
- `cd apps/web-portal && npm run build`
  - PASS
  - Next.js 15.5.20 compiled successfully and generated all routes
- `git diff --check`
  - PASS
  - No whitespace errors

## TDD Evidence

- Added focused tests for `compareEstimates()` before implementing the comparison UI:
  - Verifies POST to `/api/property-estimator/comparisons`.
  - Verifies JSON request body containing `estimate_ids`.
  - Verifies same-origin Next.js proxy usage instead of direct backend calls.
  - Verifies proxy error detail propagation.
- RED result: the focused test file passed immediately against the current implementation.
- Explanation: Task 5 had already implemented `compareEstimates()` correctly. This task addressed the reviewer’s Minor by adding missing focused coverage for already-correct existing behavior. I did not force artificial production-code churn just to manufacture a RED.
- GREEN result after UI implementation: `npm run test -- lib/property-estimator/api.test.ts` passed with 6/6 tests.

## Files changed

- Created `apps/web-portal/components/property-estimator/estimate-comparison.tsx`
- Modified `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`
- Modified `apps/web-portal/lib/property-estimator/api.test.ts`
- Created `.superpowers/sdd/task-6-report.md`

## Self-review findings

- Confirmed browser-side comparison flow calls the Next.js proxy helper and does not call `property-estimator-api` directly.
- Confirmed no CSV/PDF export, auth, persistent browser-side history, database-backed history, backend code, proxy route code, App 2 placeholder, or README changes were added.
- Confirmed `.superpowers/sdd/task-1-report.md` remained untouched despite being dirty before this task.
- Confirmed comparison button is disabled until at least two history records are selected and while comparison is in progress.
- Confirmed selected estimate records are derived from backend-owned in-memory history state.

## Concerns

- No concerns.

## Fix after review

### Root cause

`EstimatorDashboard` kept `comparison` state independent from `selectedIds`. After a successful comparison, changing the selected history records only updated `selectedIds`, while `EstimateComparison` continued rendering any non-null `comparison`. That allowed the comparison panel to show stale side-by-side results even when the compare button was disabled for fewer than two selected records.

### Files changed

- Modified `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`
  - Clears `comparison` when history selection changes.
  - Clears stale `comparison` before starting a new comparison request.
  - Clears `comparison` in the compare failure path.
- Added `apps/web-portal/lib/property-estimator/estimator-dashboard.test.tsx`
  - Focused dashboard regression test for clearing a rendered comparison after selection changes.

### RED/GREEN evidence

- RED: `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`
  - FAIL as expected before the fix.
  - Failure showed `Highest price` still rendered after deselecting one compared history record.
- GREEN: `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`
  - PASS
  - 1 test file passed
  - 1 test passed

### Command results

- `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`
  - PASS
  - 1 test file passed
  - 1 test passed
- `cd apps/web-portal && npm run test`
  - PASS
  - 5 test files passed
  - 33 tests passed
- `cd apps/web-portal && npm run lint`
  - PASS
  - ESLint exited 0 with `--max-warnings=0`
- `cd apps/web-portal && npm run typecheck`
  - PASS
  - `tsc --noEmit` exited 0
- `cd apps/web-portal && npm run build`
  - PASS
  - Next.js 15.5.20 compiled successfully and generated all routes

## Second fix after re-review

### Root cause

`handleCompare()` started an async comparison for the selected IDs from the initiating render, but it applied the response unconditionally after `compareEstimates()` resolved. If selection changed while the request was pending, `toggleSelected()` correctly cleared the current comparison and updated `selectedIds`, but the stale request could later call `setComparison(response)` and render metrics for the old selected IDs.

### Files changed

- Modified `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`
  - Snapshots selected IDs before calling `compareEstimates()`.
  - Tracks current selected IDs in a ref.
  - Applies the comparison response only when current selected IDs still match the request snapshot.
  - Preserves existing comparison clearing before compare, on selection change, and on compare failure.
- Modified `apps/web-portal/lib/property-estimator/estimator-dashboard.test.tsx`
  - Added a controlled-promise regression test for a stale in-flight comparison response after selection changes.

### RED/GREEN evidence

- RED: `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`
  - FAIL as expected before the production fix.
  - Failure showed `Highest price` rendered after deselecting one history record before the pending comparison promise resolved.
- GREEN: `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`
  - PASS
  - 1 test file passed
  - 2 tests passed

### Command results

- `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`
  - PASS
  - 1 test file passed
  - 2 tests passed
- `cd apps/web-portal && npm run test`
  - PASS
  - 5 test files passed
  - 34 tests passed
- `cd apps/web-portal && npm run lint`
  - PASS
  - ESLint exited 0 with `--max-warnings=0`
- `cd apps/web-portal && npm run typecheck`
  - PASS
  - `tsc --noEmit` exited 0
- `cd apps/web-portal && npm run build`
  - PASS
  - Next.js 15.5.20 compiled successfully and generated all routes
