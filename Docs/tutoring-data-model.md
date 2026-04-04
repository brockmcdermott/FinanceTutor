# Tutoring Data Model

## Design goals

- Content is extensible by subject domain, topic, skill, and scenario seed data.
- Scenario structures support one-to-many questions and many-to-many skill targeting.
- Learner data is separated from content and protected with user-scoped RLS.

## Core tables

- `subject_domains`: high-level curriculum namespaces (`business-finance`, future domains).
- `tutoring_topics`: topic catalog within a domain.
- `tutoring_skills`: reusable concepts/skills within a domain.
- `tutoring_topic_skills`: topic-to-skill mapping.
- `tutoring_scenarios`: business case scenarios per topic.
- `tutoring_scenario_skills`: scenario-to-skill mapping.
- `tutoring_scenario_questions`: one-or-more prompts per scenario, including numeric + explanation support.

## Learner tables

- `learner_profiles`: tutoring-specific profile extension keyed to `auth.users`.
- `tutoring_sessions`: session history and lifecycle status.
- `tutoring_attempts`: submissions with numeric/written inputs and score signals.
- `tutoring_feedback_history`: persisted feedback artifacts per attempt.
- `tutoring_skill_mastery`: confidence/mastery, streak, recency, and misconception tags per skill.

## Server-side data services

`features/tutoring/data/server/repository.ts` provides:

- `fetchAvailableTopics`
- `fetchScenariosByFilters`
- `startTutoringSession`
- `createTutoringAttempt`
- `createTutoringFeedbackHistory`
- `updateLearnerProgressFromAttempt`

These utilities are server-only and use authenticated user context where learner data is involved.
