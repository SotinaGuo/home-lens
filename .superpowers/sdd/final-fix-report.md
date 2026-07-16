# Final whole-branch review fix report

## Root cause

`EstimatorDashboard.refreshHistory()` updated `estimates` and `isHistoryLoading` whenever any `listEstimates()` request resolved. Because the dashboard starts one history request on mount and starts another after a successful estimate submit, a slower initial request could resolve after the post-submit refresh and overwrite the newer history list with stale data.

## Files changed

- `apps/web-portal/components/property-estimator/estimator-dashboard.tsx`
- `apps/web-portal/lib/property-estimator/estimator-dashboard.test.tsx`
- `apps/web-portal/README.md`
- `apps/web-portal/package.json`
- `.superpowers/sdd/final-fix-report.md`

## RED/GREEN evidence

- RED: after adding the controlled-promise regression test and before the production fix, `npm run test -- lib/property-estimator/estimator-dashboard.test.tsx` failed with 1 failing test: `keeps the newest history refresh when an older initial load resolves later`. The failure showed no history checkbox after the older initial load resolved, proving stale history overwrote the newer post-submit history.
- GREEN: after adding a monotonically increasing history request id guard, `npm run test -- lib/property-estimator/estimator-dashboard.test.tsx` passed with `3 tests`.

## Command results

- `cd apps/web-portal && npm run test -- lib/property-estimator/estimator-dashboard.test.tsx`: passed, 1 file passed, 3 tests passed.
- `cd apps/web-portal && npm run test`: passed, 5 files passed, 35 tests passed.
- `cd apps/web-portal && npm run lint`: passed.
- `cd apps/web-portal && npm run typecheck`: passed.
- `cd apps/web-portal && npm run build`: passed; Next.js compiled and generated routes successfully.

## Concerns

- `npm run build` still emits Node's `ExperimentalWarning: Type Stripping is an experimental feature and might change at any time`; the build exits successfully and this warning appears unrelated to this fix.
- `.superpowers/sdd/task-1-report.md` had pre-existing uncommitted changes and was intentionally left untouched.
