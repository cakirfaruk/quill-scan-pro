# Codebase Audit Findings

## 1) Linting tooling is broken
- **Issue:** `npm run lint` fails immediately because `@eslint/js` is missing from dependencies, so eslint cannot load its base config. This prevents automated static analysis from running at all.
- **Evidence:** `npm run lint` → `Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@eslint/js' imported from /workspace/quill-scan-pro/eslint.config.js`.
- **Impact:** Linting is disabled, letting type and quality regressions slip into the codebase.
- **Recommendation:** Add `@eslint/js` (matching the configured ESLint major version) to `devDependencies`, reinstall, and re-run lint to surface latent issues.

## 2) Supabase client is created without configuration validation
- **Issue:** `src/integrations/supabase/client.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` directly and immediately constructs a client. If either env var is missing or malformed, the app will still attempt to initialize Supabase, leading to runtime failures far from the root cause. The file also assumes `localStorage` exists, which crashes in SSR/tests.
- **Impact:** Hard-to-diagnose runtime errors and broken CI environments where `localStorage` is unavailable.
- **Recommendation:** Guard client creation with explicit validation (e.g., throw a descriptive error or no-op client when vars are absent) and gate `localStorage` access with `typeof window !== 'undefined'` to avoid server-side crashes.

## 3) Online status pings can overwhelm the database
- **Issue:** `useUpdateOnlineStatus` schedules a Supabase `UPDATE` every 30 seconds regardless of visibility state. Even after `document.hidden` triggers `setOffline`, the interval keeps running and will continue to write on every tick when the tab is backgrounded.
- **Impact:** Unnecessary write load on the `profiles` table and battery/network drain for idle users.
- **Recommendation:** Pause or clear the interval when the document is hidden, and throttle updates to emit only when the status actually changes.

## 4) Dead code in onboarding completion handler
- **Issue:** `handleOnboardingComplete` stores the promise returned by `supabase.auth.getSession()` in `userId` but never uses the variable or awaits the promise, making the assignment redundant and potentially swallowing errors.
- **Impact:** Adds noise and hides potential async failures during onboarding state updates.
- **Recommendation:** Remove the unused variable and return/await the promise so errors can be surfaced and the flow remains explicit.
