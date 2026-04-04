# Low-Level Design (LLD)
## AI-Powered Business Finance Tutor Prototype

## 1. Purpose and Scope

This LLD documents the current implementation of the tutoring prototype in this repository. It is focused on:

- actual modules/routes in this codebase
- how data and control flow through the system
- where tutoring logic, AI logic, and learner adaptation live
- how to extend topics/scenarios with minimal refactoring

This document is implementation-oriented and complements `Docs/HLD.md`.

## 2. Stack and Runtime Boundaries

- Framework: Next.js (App Router) + TypeScript
- Auth + DB: Supabase (`@supabase/ssr`)
- UI: React + Tailwind utility classes
- AI Modes:
  - mock mode (default, deterministic)
  - real mode (OpenAI chat completions with strict fallback)

Runtime boundaries:

- Server-side (trusted): route handlers, repository functions, auth checks, adaptation logic, persistence
- Client-side: practice form interactions, hint requests, feedback rendering, local review snapshot

## 3. Codebase Map (Tutoring Domain)

### 3.1 App Routes

- `app/dashboard/page.tsx`
- `app/topics/page.tsx`
- `app/practice/page.tsx`
- `app/review/page.tsx`
- `app/progress/page.tsx`
- `app/settings/page.tsx`
- `app/api/tutoring/feedback/route.ts`
- `app/api/tutoring/hint/route.ts`

Loading states:

- `app/dashboard/loading.tsx`
- `app/topics/loading.tsx`
- `app/practice/loading.tsx`
- `app/review/loading.tsx`
- `app/progress/loading.tsx`
- `app/settings/loading.tsx`

### 3.2 Feature Modules

- UI components: `features/tutoring/components/*`
- AI abstraction/providers: `features/tutoring/ai/*`
- Deterministic evaluation: `features/tutoring/evaluation/*`
- Learner model rules/state update: `features/tutoring/learner/*`
- Adaptive sequencing engine: `features/tutoring/session/adaptive-engine.ts`
- Data access/repository layer: `features/tutoring/data/server/*`
- Shared tutoring types: `features/tutoring/data/types.ts`, `features/tutoring/ai/types.ts`

### 3.3 Persistence Assets

- Migration: `supabase/migrations/20260404010500_add_tutoring_data_model.sql`
- Seed content: `supabase/seed.sql`

## 4. UI Composition

### 4.1 Page Shell

- `features/tutoring/components/protected-tutoring-page.tsx`
  - calls `requireAuth()`
  - wraps content with `TutoringAppShell`

- `features/tutoring/components/tutoring-app-shell.tsx`
  - desktop sidebar + mobile nav tabs
  - consistent header/title/learner identity block

### 4.2 Practice UI

- `features/tutoring/components/practice-session-workspace.tsx`
  - topic/scenario selection
  - hint and feedback API calls
  - adaptive recommendation + session summary display

- `features/tutoring/components/answer-form.tsx`
  - renders per-question numeric/text inputs
  - validates before submit
  - tracks per-question hint level and hint text

- `features/tutoring/components/scenario-card.tsx`
- `features/tutoring/components/feedback-card.tsx`
- `features/tutoring/components/hint-panel.tsx`

### 4.3 Progress UI

- `features/tutoring/components/progress-dashboard.tsx`
  - mastery cards, trend indicators, weak skills, recent activity

- `features/tutoring/components/review-results-panel.tsx`
  - uses localStorage snapshot for quick review panel

## 5. API Contracts

Defined in `features/tutoring/ai/contracts.ts`.

### 5.1 Feedback API

Request (`FeedbackApiRequest`):

- `topicSlug`
- `scenarioId`
- `sessionId?`
- `answers[]` where each answer includes:
  - `questionId`
  - `numericAnswer?`
  - `shortTextAnswer?`
  - `hintLevel?`

Response (`FeedbackApiResponse`):

- `sessionId`, `submittedAt`, `attemptsCreated`
- `feedback` (overall + per-question coaching)
- `adaptiveRecommendation`
- `sessionSummary`

### 5.2 Hint API

Request (`HintApiRequest`):

- `scenarioId`
- `questionId`
- `hintLevel?`

Response (`HintApiResponse`):

- `questionId`
- `hintLevel` (normalized to 1..2)
- `hint`

## 6. Request Flows

### 6.1 Hint Flow (`POST /api/tutoring/hint`)

1. Validate auth (`requireAuth`)
2. Validate payload
3. Fetch scenario from repository
4. Resolve question in scenario
5. Generate hint via `buildInstructionalHint`
6. Return normalized hint level and text

### 6.2 Submission + Feedback Flow (`POST /api/tutoring/feedback`)

1. Validate auth + payload
2. Fetch scenario and verify `topicSlug` alignment
3. Start session when no `sessionId` exists
4. Evaluate submission deterministically (`evaluatePracticeSubmission`):
   - numeric correctness with tolerance
   - explanation scoring
   - misconception tagging
5. Get AI coaching response (`createTutoringAiProvider().getFeedback(...)`)
6. Persist attempts per question (`createTutoringAttempt`)
7. Persist feedback history per attempt (`createTutoringFeedbackHistory`)
8. Update learner mastery for affected skills (`updateLearnerProgressFromAttempt`)
9. Build adaptive recommendation (`selectAdaptiveRecommendation`)
10. Build session summary and return response

## 7. Deterministic Evaluation Layer

Located in `features/tutoring/evaluation/*`.

- `numeric.ts`
  - computes delta vs expected answer
  - applies tolerance and partial scoring

- `explanation.ts`
  - checks minimum explanation quality via:
    - length score
    - keyword/topic language score
    - reasoning marker score

- `misconceptions.ts`
  - tags likely confusion patterns (e.g., gross vs net, cash vs profit)

- `hints.ts`
  - two-step hinting strategy:
    - level 1: guided, non-revealing
    - level 2: more direct scaffolding

- `evaluate-practice-submission.ts`
  - combines per-question evaluations into scenario-level score
  - computes `recommendedNextStep`

## 8. AI Provider Architecture

### 8.1 Provider Selection

`features/tutoring/ai/provider.ts`:

- `MOCK_AI=true` => mock mode
- `MOCK_AI=false` + key present => real mode
- missing key in requested real mode => runtime fallback to mock mode

### 8.2 Mock Provider

`features/tutoring/ai/mock-provider.ts`:

- deterministic coaching text using evaluated signals
- produces polished per-question and summary feedback

### 8.3 Real Provider with Fallback

`features/tutoring/ai/openai-provider.ts`:

- calls OpenAI chat completions endpoint
- requests strict JSON response format
- sanitizes/parses model response into `FeedbackResponse`
- falls back to mock response when:
  - key missing
  - rate limit (429)
  - API/network/timeout errors
  - malformed model output

Environment vars used:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `OPENAI_TIMEOUT_MS`

## 9. Learner Model and Adaptation

### 9.1 Rule Configuration

`features/tutoring/learner/rules.ts` defines:

- confidence retention/update weights
- misconception penalties
- repeated-mistake threshold
- sequencing thresholds (`remediation`, `reinforce`, `advance`)

### 9.2 Skill State Update

`features/tutoring/learner/model.ts`:

- updates skill confidence as weighted moving average
- penalizes misconception density and numeric misses
- tracks:
  - recent attempts/correct counts
  - streak
  - misconception counts
  - recent scores

### 9.3 Next Scenario Recommendation

`features/tutoring/session/adaptive-engine.ts`:

- decides strategy:
  - `remediation`
  - `scaffold`
  - `reinforce`
  - `advance`
- chooses next scenario by:
  - shared skill overlap
  - difficulty rank
  - weaker-skill targeting
  - fallback selection if no perfect candidate

## 10. Data Access Layer

`features/tutoring/data/server/repository.ts` centralizes server data logic:

- content retrieval:
  - `fetchAvailableTopics`
  - `fetchScenariosByFilters`
  - `fetchScenarioById`
- session/attempt lifecycle:
  - `startTutoringSession`
  - `createTutoringAttempt`
  - `createTutoringFeedbackHistory`
- learner analytics:
  - `updateLearnerProgressFromAttempt`
  - `fetchLearnerSkillMastery`
  - `fetchLearnerProgressDashboard`

Repository exports are re-exported from `features/tutoring/data/server/index.ts`.

## 11. Database Model (Current)

Core tutoring tables:

- `subject_domains`
- `tutoring_topics`
- `tutoring_skills`
- `tutoring_topic_skills`
- `tutoring_scenarios`
- `tutoring_scenario_skills`
- `tutoring_scenario_questions`
- `tutoring_sessions`
- `tutoring_attempts`
- `tutoring_feedback_history`
- `tutoring_skill_mastery`
- `learner_profiles`

Seed state:

- subject domain slug: `business-finance`
- finance topics: revenue, gross profit, net profit, fixed vs variable expenses, cash flow, ROI, cap rate
- scenarios: baseline set plus demo booster scenarios (see `supabase/seed.sql`)

## 12. Extension Guide (Practical)

To add a new topic with no core refactor:

1. Add topic row in seed/migration (`tutoring_topics`)
2. Add/associate skills (`tutoring_skills`, `tutoring_topic_skills`)
3. Add scenarios (`tutoring_scenarios`)
4. Add question rows (`tutoring_scenario_questions`)
5. Link scenario skills (`tutoring_scenario_skills`)
6. Run seed and reload app

Optional tuning:

- modify misconception/tag penalties in `features/tutoring/learner/rules.ts`
- modify sequencing thresholds in `features/tutoring/learner/rules.ts`
- adjust feedback tone/templates in `features/tutoring/ai/mock-provider.ts`

## 13. Known Limitations / Intentional Tradeoffs

- `review` page currently uses localStorage snapshot (`progress-store.ts`) rather than DB-backed history.
- Explanation evaluation remains heuristic/rule-based (intended for class prototype simplicity).
- Real AI response parsing is strict and safe-first; on parse mismatch it intentionally falls back to mock.

## 14. Troubleshooting

Common startup issue:

- Error: `Unable to resolve subject domain: business-finance`
- Cause: seed/migration not applied in target Supabase project
- Fix: run migration + `supabase/seed.sql`, verify `subject_domains.slug='business-finance'`

Supabase client env issue:

- Ensure `.env.local` contains:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

For demo script and order of operations, see `Docs/how-to-demo.md`.
