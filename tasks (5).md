# EdMap MVP — Granular Task Plan

Each task is tiny, testable, and focused on one concern. Suggested order is top to bottom. Mark checks as you go.

## Phase 0: Repo and base
1. **Create Next.js app**
   - Start: Run `pnpm create next-app` with App Router, TS, Tailwind.
   - End: Local server runs at `http://localhost:3000` showing placeholder dashboard.

2. **Add Supabase client**
   - Start: Install `@supabase/ssr @supabase/supabase-js`.
   - End: `lib/supabaseClient.ts` returns browser and server clients.

3. **Configure Tailwind and shadcn/ui**
   - Start: Install Tailwind, init config, add base styles.
   - End: One shadcn Button renders on the homepage.

4. **Add TanStack Query and Zustand**
   - Start: Install packages and set React Query provider in `layout.tsx`.
   - End: A demo query and a small Zustand store both work.

## Phase 1: Auth and profile
5. **Enable Supabase Auth**
   - Start: Turn on email magic link in Supabase.
   - End: Sign in and sign out buttons work and session is visible server‑side.

6. **Create `profiles` table and RLS**
   - Start: Write migration SQL for `profiles` with FK to `auth.users`.
   - End: New user gets a profile row after first login. RLS tested with another user.

7. **Onboarding page**
   - Start: Create `(onboarding)/connect` route.
   - End: Page reads session and shows provider cards.

## Phase 2: Core schema
8. **Create `courses`, `sources`, `items` tables**
   - Start: Write migration SQL with indexes and RLS policies.
   - End: Insert and select work only for the owner. Verified with SQL tests.

9. **Seed script**
   - Start: Add `seed.sql` with one demo course and five items.
   - End: Dashboard shows seeded items after login.

## Phase 3: Canvas connector (MVP)
10. **Canvas OAuth config**
    - Start: Create dev client on Canvas instance, set redirect URL.
    - End: `/api/integrations/canvas/oauth` redirects to Canvas auth screen.

11. **Handle OAuth callback**
    - Start: Implement token exchange and save in `integration_secrets` for user.
    - End: Token stored encrypted and linked to `integrations` row.

12. **Fetch Canvas courses**
    - Start: Add `/api/integrations/canvas/courses` that calls Canvas list courses.
    - End: Returns an array of courses for the user.

13. **Fetch Canvas assignments and events**
    - Start: Add `/api/integrations/canvas/items` to list assignments, quizzes, events.
    - End: Raw JSON saved to a staging table or passed to normalizer.

14. **Normalize Canvas payload**
    - Start: Implement `normalize/mapCanvas.ts`.
    - End: `items` and `events` rows created with correct fields and deduping by external id.

15. **Sync log**
    - Start: Write `sync_runs` insert, update, and error capture.
    - End: Successful run shows counts; errors recorded in `sync_errors`.

## Phase 4: Manual and ICS ingestion
16. **Manual item form**
    - Start: Create a modal to add one item with title, type, due time, url.
    - End: Inserted item appears in the graph.

17. **ICS upload endpoint**
    - Start: `/api/integrations/ical` accepts a file or URL.
    - End: Events and items created from ICS with dedupe by UID.

18. **Gradescope ICS import (MVP path)**
    - Start: Allow user to paste a course calendar ICS URL or upload exported ICS.
    - End: Items appear under a `gradescope` source.

## Phase 5: Graph rendering
19. **Graph API**
    - Start: Implement `/api/graph` returning nodes and edges for the user.
    - End: Returns course → source → item graph as JSON.

20. **React Flow canvas**
    - Start: Add `FlowCanvas.tsx` with custom node components.
    - End: Graph renders with pan, zoom, and selection.

21. **Node actions**
    - Start: Add side panel with item details and actions.
    - End: Mark as submitted toggles `items.status` and updates UI.

22. **Filters**
    - Start: Add date range, type, and status filters in the toolbar.
    - End: Graph refetches with filters applied.

## Phase 6: Calendar and plan
23. **Calendar view**
    - Start: Add list and calendar tabs.
    - End: Month and week views show items by due time.

24. **Daily plan compute**
    - Start: Implement `plan/computePlan.ts` to sort by urgency and estimate.
    - End: “Today” plan shows a stack of suggested tasks.

## Phase 7: Notifications
25. **Email provider setup**
    - Start: Add Resend API key and a simple mailer.
    - End: Test email sends to the signed in user.

26. **Reminder scheduler**
    - Start: Create a cron endpoint that finds items due in user windows.
    - End: Email summary sends once per day with the next 24–72 hours of items.

## Phase 8: Polish and safety
27. **Edge cases for timezones**
    - Start: Require `profiles.timezone` and store times in UTC.
    - End: Due times render correctly for another timezone in tests.

28. **RLS review and audit**
    - Start: Review all tables and policies.
    - End: A second test user sees none of the first user’s data.

29. **Error surfaces**
    - Start: Add a toast and a debug drawer for last sync status.
    - End: Failures are visible and copyable for support.

## Phase 9: Acceptance tests
30. **Student journey test**
    - Start: Fresh account flow: login → connect Canvas → import → graph.
    - End: All nodes appear and clicking an item opens the source in a new tab.

31. **Fallback journey test**
    - Start: Create a course and import via ICS only.
    - End: Items show under the correct source and dedupe works.

32. **Performance test**
    - Start: Seed 300 items and 4 courses.
    - End: Graph interactions stay smooth under 50 ms frame budget.

## Optional post‑MVP
33. **PrairieLearn token import**
    - One token flow and items fetch.

34. **PrairieTest token import**
    - Token flow and items fetch.

35. **Discord DM notifications**
    - Connect Discord and send due alerts.

36. **Grade projections**
    - Compute current grade and needed points for target thresholds.

37. **Collab view**
    - Share a read‑only graph with a tutor or peer.

