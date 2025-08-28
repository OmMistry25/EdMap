# EdMap: Visual Academic Planner — Architecture

## 1) Product description
EdMap is a web app that lets college students connect their course systems and see the whole semester as an interactive flowchart. Each course sits at the top, branches to its sources (Canvas, Gradescope, PrairieLearn, PrairieTest), and each source branches to upcoming items such as deadlines, submissions, quizzes, and exams. Students can click any node to open the native page, mark items as done, and generate a calendar timeline.

**Stack**: Next.js (App Router) for frontend and API routes, Supabase for Postgres, auth, file storage, and RLS, React Flow for the diagram, TanStack Query for data fetching, Zustand for local UI state, shadcn/ui + Tailwind for UI, Zod for validation, and background jobs via Supabase cron or Vercel Cron jobs. Integrations use OAuth where possible and signed webhooks or email/ICS fallback when APIs are limited.

---

## 2) High level architecture
- **Web client (Next.js 14)**: Server Components for fast data loading, Client Components for interactive diagram and drag interactions.
- **Auth**: Supabase Auth with SSO providers if offered by the school domain. Optional email magic link.
- **APIs**: Next.js route handlers under `/app/api/*` for connectors, importers, and normalization endpoints. Edge runtime for light endpoints, Node runtime for heavier work.
- **DB**: Supabase Postgres with strict Row Level Security. Core tables for users, courses, sources, items, grades, events, and sync runs.
- **Ingestion**:
  - **Canvas**: REST API + OAuth2 and/or iCal assignment feeds.
  - **Gradescope**: No official public OAuth in many cases, so use user‑provided course calendar ICS, email parse fallback, or manual CSV import. Keep ToS‑safe by asking the student for exported data or calendar URLs.
  - **PrairieLearn**: Course API where available or user token + course export, plus email parse fallback.
  - **PrairieTest**: Similar to PrairieLearn. Support manual import if API access is not available.
- **Normalization**: Convert all raw payloads into a unified `item` schema. Map types: assignment, quiz, exam, project, lab, reading, survey, discussion.
- **Computation**: A small scheduler computes derived fields such as urgency, estimated time, and conflicts. Generates a daily plan and a semester timeline.
- **Visualization**: React Flow graph built from normalized items. Course node → Source node → Item nodes. Side panel shows details and deep links.
- **Notifications**: Email and in‑app reminders with user‑configurable windows (24h, 3d, custom). Optional Slack or Discord DM.
- **Files**: Store manual CSV/ICS uploads in Supabase Storage with metadata tying to a sync run.
- **Observability**: Sync logs, error logs, and per‑connector health in `sync_runs` and `sync_errors` tables.

---

## 3) Data model (Postgres in Supabase)
**Users and profiles**
- `users` (managed by Supabase auth)
- `profiles` (`id PK` references `auth.users.id`, `full_name`, `school_email`, `timezone`, `onboarding_done_at`)

**Core academic graph**
- `courses` (`id PK`, `owner_id`, `title`, `code`, `term`, `instructor`, `color_hex`)
- `sources` (`id PK`, `course_id FK`, `provider ENUM('canvas','gradescope','prairielearn','prairietest','manual')`, `display_name`, `external_course_id`, `connected_at`, `status`)
- `items` (`id PK`, `course_id FK`, `source_id FK`, `title`, `type ENUM('assignment','quiz','exam','project','lab','reading','survey','discussion')`, `status ENUM('upcoming','submitted','graded','missed','cancelled')`, `due_at TIMESTAMPTZ`, `available_at`, `points_possible NUMERIC`, `url`, `estimated_minutes INT`, `labels TEXT[]`, `raw_ref JSONB`)
- `grades` (`id PK`, `item_id FK`, `score NUMERIC`, `out_of NUMERIC`, `graded_at`)
- `events` (`id PK`, `course_id FK`, `title`, `start_at`, `end_at`, `kind ENUM('lecture','lab','office_hours','review','exam')`, `location`, `url`, `raw_ref JSONB`)

**Sync layer**
- `integrations` (`id PK`, `owner_id`, `provider`, `status`, `created_at`)
- `integration_secrets` (`integration_id`, encrypted tokens or credentials stored via Supabase vault or KMS, rotated and never exposed to client)
- `sync_runs` (`id PK`, `integration_id`, `source_id`, `started_at`, `finished_at`, `status ENUM('success','partial','error')`, `stats JSONB`)
- `sync_errors` (`id PK`, `sync_run_id`, `stage`, `message`, `raw JSONB`)

**User preferences**
- `settings` (`owner_id PK`, `timezone`, `notify_email`, `notify_window_hours INT[]`, `default_estimate_minutes INT`)
- `acknowledgements` (`owner_id`, `item_id`, `ack_type ENUM('dismissed','snoozed','planned')`, `created_at`)

**Indexes and constraints**
- Index on `items.due_at`, `items.status`, `items.course_id`
- Unique `(source_id, url)` where possible to avoid duplicates
- Foreign keys cascade on delete to keep graph clean

---

## 4) Folder and file structure (Next.js + Supabase)

```text
edmap/
  .env.local
  next.config.mjs
  package.json
  postcss.config.mjs
  tailwind.config.ts
  tsconfig.json
  prisma/                     # optional if using Prisma Client with Supabase
    schema.prisma
  src/
    app/
      layout.tsx
      page.tsx                # Dashboard or onboarding entry
      api/
        auth/
          route.ts            # session helpers or wrappers
        integrations/
          canvas/
            oauth/
              route.ts        # start OAuth, handle callback
            courses/route.ts  # list courses
            items/route.ts    # fetch assignments
            ical/route.ts     # accept iCal URL, ingest
          gradescope/
            ingest/route.ts   # email/ICS/manual endpoints
          prairielearn/
            tokens/route.ts
            items/route.ts
          prairietest/
            tokens/route.ts
            items/route.ts
        normalize/route.ts    # normalize raw payload to items/events
        graph/route.ts        # build graph JSON for a user
        plan/route.ts         # compute daily/weekly plan
        webhooks/
          email/route.ts      # inbound email parse endpoint
      (onboarding)/
        connect/page.tsx
      dashboard/
        page.tsx
      courses/[courseId]/page.tsx
      settings/page.tsx
    components/
      graph/FlowCanvas.tsx    # React Flow canvas
      graph/NodeCourse.tsx
      graph/NodeSource.tsx
      graph/NodeItem.tsx
      ui/                     # shadcn components
    lib/
      supabaseClient.ts
      auth.ts                 # getServerSession, helpers
      validators.ts           # Zod schemas
      connectors/
        canvas.ts             # API client for Canvas
        gradescope.ts         # parsers for ICS or HTML exports
        prairielearn.ts
        prairietest.ts
        email.ts              # email payload normalizer
        ical.ts               # generic ICS import
      normalize/
        mapCanvas.ts
        mapGradescope.ts
        mapPrairieLearn.ts
        mapPrairieTest.ts
        types.ts              # unified item types
      graph/
        buildGraph.ts         # course → source → item nodes, edges
      plan/
        computePlan.ts
      db/
        queries.ts            # typed SQL queries with Kysely or Prisma
        rls.ts                # policy helpers
    styles/
      globals.css
    state/
      useUIState.ts           # Zustand for local UI state
    hooks/
      useSupabaseUser.ts
      useGraph.ts             # TanStack Query hooks
    pages/                    # only if mixing Pages Router
  supabase/
    migrations/               # SQL files
    seed.sql
  README.md
```

**What each part does**
- `app/api/*`: Server endpoints for auth helpers, connectors, normalization, planning, graph build, and webhooks.
- `lib/connectors/*`: Provider specific fetchers and parsers.
- `lib/normalize/*`: Map vendor payloads into unified shapes.
- `lib/graph/buildGraph.ts`: Returns nodes and edges for React Flow.
- `components/graph/*`: Custom nodes and panels for the diagram.
- `state/useUIState.ts`: Pure client UI state such as zoom, selection, filters.
- `hooks/useGraph.ts`: Fetch graph JSON given filters, handles caching and refetch.
- `db/queries.ts`: Typed data access and caching helpers.
- `supabase/migrations`: SQL migrations and RLS policies.

**Where state lives**
- **Server state**: Items, courses, sources, grades, events in Supabase Postgres.
- **Client state**: Diagram presentation (zoom, pan, collapsed groups, color choices) in Zustand.
- **Async state**: Fetch and cache graph JSON, items, and plan via TanStack Query. Revalidate on focus and on sync completion webhooks.

**How services connect**
1. User authenticates with Supabase. Session is available server‑side in Next.js.
2. User connects a provider. For Canvas, OAuth is completed and tokens stored server‑side.
3. Background job runs `connectors/{provider}` fetch. Data lands in `raw` tables or in memory, then `normalize/*` maps to `items`, `events`, `grades`.
4. `/api/graph` assembles the academic graph for that user. Client renders it with React Flow.
5. Optional email webhook receives notifications, maps to items, and upserts by `(source_id, url or external_id)`.
6. Reminders read from `items` and user `settings`, then send email via Resend or Supabase functions.

---

## 5) Connectors and ingestion strategies

### Canvas
- **Primary**: OAuth2 and REST API (courses, assignments, quizzes, calendar events).
- **Fallback**: iCal feed import per course or per user.
- **Notes**: Respect rate limits and pagination. Store `external_course_id` and `external_item_id` for dedupe.

### Gradescope
- **Primary**: Use exported ICS feeds or CSV exports the student uploads. Some schools expose class calendars per course.
- **Fallback**: Email parsing from Gradescope notifications that include due times and links.
- **Notes**: Keep ToS safe. Never ask for passwords. Prefer uploads and links that the student owns.

### PrairieLearn
- **Primary**: Token based API if the course enables it or CSV exports.
- **Fallback**: Email parsing. Manual form for adding recurring quiz windows.
- **Notes**: Store timezone on items because PL windows often use course local time.

### PrairieTest
- **Primary**: Token based API or exports where available.
- **Fallback**: Manual entry template for exam windows and check‑in requirements.

### Email ingest
- Set up a unique inbound email address per user, or a verified domain with provider such as Resend. Forward notifications to this address. Parse subject and body with deterministic regex and Zod validation. Create or update items.

### ICS ingest
- Accept a URL or file. Parse with an ICS parser. Map VEVENT to items or events with start/end, description, and URL. Use `(source_id, UID)` to dedupe.

---

## 6) Graph and UI design

**React Flow setup**
- Nodes: `course`, `source`, `item`
- Edges: `course→source`, `source→item`
- Node data: title, due time, status, chip for type, points, and deep link
- Grouping: Collapsible groups per course and per source
- Filters: by date range, status, type, and course
- Actions: Mark as submitted, snooze, open in source, set estimate

**Aux views**
- Calendar timeline (day, week, month)
- List with quick filters and bulk actions
- Course detail with grade breakdown and upcoming plan

**Performance**
- Virtualize item lists in side panel. Batch edges. Lazy load details for off‑screen nodes.

---

## 7) Security and privacy
- RLS on every table keyed by `owner_id`.
- Tokens stored server‑side only and encrypted. Never expose to the browser.
- All ingestion routes verify the session and source ownership.
- Webhook signatures verified.
- Audit trail in `sync_runs` and `sync_errors`.
- PII minimization. Only store what is needed to render the plan.
- Backups enabled on Supabase. Rotate secrets monthly.

**Example RLS snippets (pseudo‑SQL)**
```sql
create policy "Users can select own rows"
on items for select
using (owner_id = auth.uid());

create policy "Users can insert own rows"
on items for insert
with check (owner_id = auth.uid());
```

---

## 8) Environment and config
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server routes
- `CANVAS_CLIENT_ID`, `CANVAS_CLIENT_SECRET`, `CANVAS_BASE_URL`
- `RESEND_API_KEY` for emails
- `ENCRYPTION_KEY` for integration secrets
- `APP_BASE_URL` and `CRON_SECRET`

---

## 9) Local development
- `supabase start` to run local Postgres
- `npm run dev` to start Next.js
- Seed with a mock course and items via `seed.sql`
- Storybook optional for node components

---

## 10) MVP cut
- Auth, course creation, Canvas import, manual add, ICS upload, normalized items, React Flow graph, calendar view, mark submitted, and basic email reminders.
- Gradescope and Prairie* support via ICS or manual upload in MVP. Rich API linking can come after proof of value.

