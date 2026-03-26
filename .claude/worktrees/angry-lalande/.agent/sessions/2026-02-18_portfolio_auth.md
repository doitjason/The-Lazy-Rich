# Session Summary: Portfolio Empty State & Google Auth Refactor (Part 1)

## 📅 Date: 2026-02-18

## 🎯 Objective
- Replace email/password login with Google Sign-In in Profile.
- Implement a premium "Empty State" for the Portfolio with ability to preview sample portfolios (Guest Mode).
- Fix React Hook order errors in the Portfolio Dashboard to ensure stability.

## 🛠️ Key Changes
1.  **Google Authentication Integration**
    -   Removed email/password form from `ProfileSettings.tsx`.
    -   Added a "Sign in with Google" button using `signInWithGoogle` from `AuthContext`.
    -   *Note: User reported issues with Vercel deploying redirecting to localhost.*

2.  **Portfolio Empty State (`EmptyPortfolio.tsx`)**
    -   Designed a premium Glassmorphism UI using Stitch tool inspiration.
    -   Added **"Sample Portfolio Preview"** functionality:
        -   **60/40 Portfolio**: Classic balanced strategy.
        -   **All-Weather**: Ray Dalio's risk-parity strategy.
        -   **Tech Growth**: NASDAQ-heavy aggressive strategy.
    -   Connected to `usePortfolioStore.setLocalItems` to allow non-persistent previewing for guests.

3.  **Stability Fixes**
    -   Fixed **React Hook Order Error** in `PortfolioDashboard.tsx`.
    -   Moved `EmptyPortfolio` conditional rendering to the end of the component.
    -   Extracted inline `useMemo` for `BenchmarkCard` to top-level to prevent hook count mismatches.

## 🚧 Known Issues & Next Steps (Priority for Next Session)
1.  **Google Login Redirect Issue (Vercel vs Localhost)**
    -   **Symptom:** When attempting to log in on the Vercel deployment, Supabase redirects the user back to `localhost` instead of the production domain.
    -   **Potential Cause:** `window.location.origin` in `AuthContext` might be correct, but Supabase Authentication settings ("Site URL" and "Redirect URLs") likely miss the Vercel domain.
    -   **Action Plan:**
        -   Check conditional logic for `redirectTo` based on environment (Development vs Production).
        -   Guide user to update Supabase Auth settings.

2.  **Sign-up Flow Verification**
    -   User mentioned "Sign-up is not working".
    -   Need to verify if a new user record/profile row is correctly created upon first Google Login.

3.  **Portfolio Data Persistence**
    -   Ensure that when a guest user (who is previewing a sample portfolio) finally logs in, their preview data is either cleared or (optionally) offered to be saved. Currently, it might just vanish on reload, which is expected behavior but should be verified.

## 📝 Files Modified
-   `src/components/profile/ProfileSettings.tsx`
-   `src/contexts/AuthContext.tsx`
-   `src/components/portfolio/PortfolioDashboard.tsx`
-   `src/components/portfolio/EmptyPortfolio.tsx`
-   `src/store/usePortfolioStore.ts`
