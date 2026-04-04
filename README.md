# Next.js + Supabase Starter

This is a Next.js 15+ App Router starter integrated with Supabase Auth (cookie-based sessions via `@supabase/ssr`).

## Development

1) Install dependencies:

```bash
npm install
```

2) Configure environment:

Copy `.env.example` to `.env.local` and fill the values from your Supabase Project Settings → API:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
MOCK_AI=true
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

3) Run the app in dev mode:

```bash
npm run dev
```

Optional checks/builds:

```bash
npm run lint
npm run build
```

## Supabase CLI

The Supabase CLI is included in devDependencies. For pushing migrations to your hosted project, log in and link once:

```bash
npx supabase login
npx supabase link
```

### Local Supabase (containers)

Requires Docker. Start/stop local stack:

```bash
npm run supabase:start
npm run supabase:stop
```

## Database Migrations

Scripts are available in `package.json` to help generate and apply migrations.

- Generate a new migration (diff current DB → SQL file). Provide a descriptive name:

```bash
npm run db:migrate:generate -- --name add_profile_fields
```

You can pass extra flags (e.g., `--schema public`).

- Apply migrations to the linked project:

```bash
npm run db:migrate:run
```

- Reset local dev database and re-apply migrations:

```bash
npm run db:reset
```

## Tutoring Data Layer

The tutoring prototype now includes a normalized, extensible content model with:

- `subject_domains` for multi-subject support (finance today, other subjects later)
- `tutoring_topics`, `tutoring_skills`, and join tables for many-to-many concept mapping
- `tutoring_scenarios` and `tutoring_scenario_questions` for multi-question scenario flows
- `tutoring_sessions`, `tutoring_attempts`, `tutoring_feedback_history`
- `tutoring_skill_mastery` and `learner_profiles` extension for progression data

### Seed data

Seed content is in:

- `supabase/seed.sql`

The seed is idempotent and currently populates the finance domain with:

- 7 topics (revenue, gross profit, net profit, fixed vs variable expenses, cash flow, ROI, cap rate)
- 3 scenarios per topic (21 total)
- scenario-question and scenario-skill mappings

### Apply migrations + seeds

Local containers:

```bash
npm run supabase:start
npm run db:reset
```

Hosted/linked project migrations (no local seed execution):

```bash
npm run db:migrate:run
```

## Practice + AI Feedback Flow

- `app/practice/page.tsx` loads topics/scenarios from Supabase and renders a DB-backed practice workspace.
- `POST /api/tutoring/hint` returns level-1/level-2 hints per question.
- `POST /api/tutoring/feedback` evaluates numeric + explanation answers, tags misconceptions, saves attempts/feedback history, updates skill mastery, and returns structured coaching feedback.
- Adaptive recommendation is generated per submission using rule-based learner state in `features/tutoring/learner/*` and sequencing rules in `features/tutoring/session/adaptive-engine.ts`.
- Progress dashboard (`/progress`) is powered by persisted learner state (`tutoring_skill_mastery`) and attempt history (`tutoring_attempts`).

### Mock vs real AI mode

- Default: `MOCK_AI=true` for reliable demo behavior with polished tutoring responses.
- Real-mode attempt: set `MOCK_AI=false` and provide `OPENAI_API_KEY`.
- Fallback behavior: if `MOCK_AI=false` but `OPENAI_API_KEY` is missing, runtime automatically falls back to mock mode.
- `TUTORING_AI_MODE` is still read for backward compatibility, but `MOCK_AI` is preferred.

## Notes

- Ensure `.env.local` has the public keys: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Tutoring AI mode defaults to mock via `MOCK_AI=true`. Real mode wiring is scaffolded for future OpenAI integration.
- For protected pages/components, see patterns in `lib/auth.ts` and `lib/supabase/*`.
- If you use local containers, make sure Docker is running.

## Tutoring Prototype Routes

- `/dashboard` - Home dashboard
- `/topics` - Finance topics catalog
- `/practice` - Scenario-based practice session
- `/review` - Review and results
- `/progress` - Learner progress tracking
- `/settings` - Tutoring and AI settings
