set check_function_bodies = off;

create table if not exists public.subject_domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists subject_domains_slug_key
  on public.subject_domains (slug);

create table if not exists public.learner_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  preferred_subject_domain_id uuid references public.subject_domains(id) on delete set null,
  preferred_response_style text not null default 'coaching',
  target_difficulty text not null default 'foundation',
  timezone text,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists learner_profiles_user_id_key
  on public.learner_profiles (user_id);

create table if not exists public.tutoring_topics (
  id uuid primary key default gen_random_uuid(),
  subject_domain_id uuid not null references public.subject_domains(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  display_order integer not null default 1 check (display_order > 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists tutoring_topics_subject_domain_slug_key
  on public.tutoring_topics (subject_domain_id, slug);

create index if not exists tutoring_topics_subject_order_idx
  on public.tutoring_topics (subject_domain_id, display_order, is_active);

create table if not exists public.tutoring_skills (
  id uuid primary key default gen_random_uuid(),
  subject_domain_id uuid not null references public.subject_domains(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  difficulty_level text not null default 'foundation',
  display_order integer not null default 1 check (display_order > 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists tutoring_skills_subject_domain_slug_key
  on public.tutoring_skills (subject_domain_id, slug);

create index if not exists tutoring_skills_subject_order_idx
  on public.tutoring_skills (subject_domain_id, display_order, is_active);

create table if not exists public.tutoring_topic_skills (
  topic_id uuid not null references public.tutoring_topics(id) on delete cascade,
  skill_id uuid not null references public.tutoring_skills(id) on delete cascade,
  created_at timestamp with time zone not null default timezone('utc', now()),
  primary key (topic_id, skill_id)
);

create table if not exists public.tutoring_scenarios (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.tutoring_topics(id) on delete cascade,
  slug text not null,
  title text not null,
  business_context text not null,
  difficulty_level text not null default 'foundation',
  display_order integer not null default 1 check (display_order > 0),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists tutoring_scenarios_topic_slug_key
  on public.tutoring_scenarios (topic_id, slug);

create index if not exists tutoring_scenarios_topic_difficulty_idx
  on public.tutoring_scenarios (topic_id, difficulty_level, display_order, is_active);

create table if not exists public.tutoring_scenario_skills (
  scenario_id uuid not null references public.tutoring_scenarios(id) on delete cascade,
  skill_id uuid not null references public.tutoring_skills(id) on delete cascade,
  skill_weight numeric(4, 3) not null default 1.0 check (skill_weight > 0 and skill_weight <= 1),
  created_at timestamp with time zone not null default timezone('utc', now()),
  primary key (scenario_id, skill_id)
);

create table if not exists public.tutoring_scenario_questions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.tutoring_scenarios(id) on delete cascade,
  question_order integer not null check (question_order > 0),
  prompt text not null,
  response_format text not null default 'mixed' check (response_format in ('numeric', 'short_text', 'mixed')),
  numeric_answer numeric,
  numeric_tolerance numeric check (numeric_tolerance is null or numeric_tolerance >= 0),
  unit text,
  explanation_prompt text,
  hint text,
  rubric jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists tutoring_scenario_questions_order_key
  on public.tutoring_scenario_questions (scenario_id, question_order);

create unique index if not exists tutoring_scenario_questions_id_scenario_key
  on public.tutoring_scenario_questions (id, scenario_id);

create table if not exists public.tutoring_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_domain_id uuid references public.subject_domains(id) on delete set null,
  topic_id uuid references public.tutoring_topics(id) on delete set null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at timestamp with time zone not null default timezone('utc', now()),
  ended_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now()),
  check (ended_at is null or ended_at >= started_at)
);

create index if not exists tutoring_sessions_user_started_idx
  on public.tutoring_sessions (user_id, started_at desc);

create index if not exists tutoring_sessions_topic_idx
  on public.tutoring_sessions (topic_id);

create table if not exists public.tutoring_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.tutoring_sessions(id) on delete set null,
  scenario_id uuid not null references public.tutoring_scenarios(id) on delete cascade,
  question_id uuid not null,
  attempt_number integer not null default 1 check (attempt_number > 0),
  numeric_answer numeric,
  short_text_answer text,
  correctness_score numeric(4, 3) check (correctness_score is null or (correctness_score >= 0 and correctness_score <= 1)),
  is_numeric_correct boolean,
  misconception_tags text[] not null default '{}',
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  submitted_at timestamp with time zone not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  constraint tutoring_attempts_question_belongs_to_scenario_fkey
    foreign key (question_id, scenario_id)
    references public.tutoring_scenario_questions(id, scenario_id)
    on delete cascade
);

create index if not exists tutoring_attempts_user_submitted_idx
  on public.tutoring_attempts (user_id, submitted_at desc);

create index if not exists tutoring_attempts_session_idx
  on public.tutoring_attempts (session_id);

create index if not exists tutoring_attempts_scenario_idx
  on public.tutoring_attempts (scenario_id);

create table if not exists public.tutoring_feedback_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid not null references public.tutoring_attempts(id) on delete cascade,
  provider_mode text not null default 'mock' check (provider_mode in ('mock', 'real')),
  model_name text,
  feedback_summary text not null,
  strengths text[] not null default '{}',
  improvements text[] not null default '{}',
  recommended_next_step text not null default 'repeat' check (recommended_next_step in ('advance', 'repeat', 'review')),
  hint_provided text,
  score numeric(4, 3) check (score is null or (score >= 0 and score <= 1)),
  raw_feedback jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists tutoring_feedback_history_attempt_idx
  on public.tutoring_feedback_history (attempt_id, created_at desc);

create index if not exists tutoring_feedback_history_user_idx
  on public.tutoring_feedback_history (user_id, created_at desc);

create table if not exists public.tutoring_skill_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id uuid not null references public.tutoring_skills(id) on delete cascade,
  confidence_score numeric(4, 3) not null default 0 check (confidence_score >= 0 and confidence_score <= 1),
  mastery_level text not null default 'early' check (mastery_level in ('early', 'developing', 'proficient')),
  recent_correct_count integer not null default 0 check (recent_correct_count >= 0),
  recent_attempt_count integer not null default 0 check (recent_attempt_count >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_practiced_at timestamp with time zone,
  misconception_tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists tutoring_skill_mastery_user_skill_key
  on public.tutoring_skill_mastery (user_id, skill_id);

create index if not exists tutoring_skill_mastery_user_last_practiced_idx
  on public.tutoring_skill_mastery (user_id, last_practiced_at desc);

alter table public.subject_domains enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.tutoring_topics enable row level security;
alter table public.tutoring_skills enable row level security;
alter table public.tutoring_topic_skills enable row level security;
alter table public.tutoring_scenarios enable row level security;
alter table public.tutoring_scenario_skills enable row level security;
alter table public.tutoring_scenario_questions enable row level security;
alter table public.tutoring_sessions enable row level security;
alter table public.tutoring_attempts enable row level security;
alter table public.tutoring_feedback_history enable row level security;
alter table public.tutoring_skill_mastery enable row level security;

grant select on public.subject_domains to anon, authenticated;
grant select on public.tutoring_topics to anon, authenticated;
grant select on public.tutoring_skills to anon, authenticated;
grant select on public.tutoring_topic_skills to anon, authenticated;
grant select on public.tutoring_scenarios to anon, authenticated;
grant select on public.tutoring_scenario_skills to anon, authenticated;
grant select on public.tutoring_scenario_questions to anon, authenticated;

grant select, insert, update, delete on public.learner_profiles to authenticated;
grant select, insert, update, delete on public.tutoring_sessions to authenticated;
grant select, insert, update, delete on public.tutoring_attempts to authenticated;
grant select, insert, update, delete on public.tutoring_feedback_history to authenticated;
grant select, insert, update, delete on public.tutoring_skill_mastery to authenticated;

grant all privileges on public.subject_domains to service_role;
grant all privileges on public.learner_profiles to service_role;
grant all privileges on public.tutoring_topics to service_role;
grant all privileges on public.tutoring_skills to service_role;
grant all privileges on public.tutoring_topic_skills to service_role;
grant all privileges on public.tutoring_scenarios to service_role;
grant all privileges on public.tutoring_scenario_skills to service_role;
grant all privileges on public.tutoring_scenario_questions to service_role;
grant all privileges on public.tutoring_sessions to service_role;
grant all privileges on public.tutoring_attempts to service_role;
grant all privileges on public.tutoring_feedback_history to service_role;
grant all privileges on public.tutoring_skill_mastery to service_role;

drop policy if exists "Subject domains are readable" on public.subject_domains;
create policy "Subject domains are readable"
  on public.subject_domains
  for select
  using (true);

drop policy if exists "Tutoring topics are readable" on public.tutoring_topics;
create policy "Tutoring topics are readable"
  on public.tutoring_topics
  for select
  using (true);

drop policy if exists "Tutoring skills are readable" on public.tutoring_skills;
create policy "Tutoring skills are readable"
  on public.tutoring_skills
  for select
  using (true);

drop policy if exists "Tutoring topic skills are readable" on public.tutoring_topic_skills;
create policy "Tutoring topic skills are readable"
  on public.tutoring_topic_skills
  for select
  using (true);

drop policy if exists "Tutoring scenarios are readable" on public.tutoring_scenarios;
create policy "Tutoring scenarios are readable"
  on public.tutoring_scenarios
  for select
  using (true);

drop policy if exists "Tutoring scenario skills are readable" on public.tutoring_scenario_skills;
create policy "Tutoring scenario skills are readable"
  on public.tutoring_scenario_skills
  for select
  using (true);

drop policy if exists "Tutoring scenario questions are readable" on public.tutoring_scenario_questions;
create policy "Tutoring scenario questions are readable"
  on public.tutoring_scenario_questions
  for select
  using (true);

drop policy if exists "Users can view their own learner profile" on public.learner_profiles;
create policy "Users can view their own learner profile"
  on public.learner_profiles
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own learner profile" on public.learner_profiles;
create policy "Users can insert their own learner profile"
  on public.learner_profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own learner profile" on public.learner_profiles;
create policy "Users can update their own learner profile"
  on public.learner_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own tutoring sessions" on public.tutoring_sessions;
create policy "Users can view their own tutoring sessions"
  on public.tutoring_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own tutoring sessions" on public.tutoring_sessions;
create policy "Users can create their own tutoring sessions"
  on public.tutoring_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tutoring sessions" on public.tutoring_sessions;
create policy "Users can update their own tutoring sessions"
  on public.tutoring_sessions
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tutoring sessions" on public.tutoring_sessions;
create policy "Users can delete their own tutoring sessions"
  on public.tutoring_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own tutoring attempts" on public.tutoring_attempts;
create policy "Users can view their own tutoring attempts"
  on public.tutoring_attempts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own tutoring attempts" on public.tutoring_attempts;
create policy "Users can create their own tutoring attempts"
  on public.tutoring_attempts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tutoring attempts" on public.tutoring_attempts;
create policy "Users can update their own tutoring attempts"
  on public.tutoring_attempts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tutoring attempts" on public.tutoring_attempts;
create policy "Users can delete their own tutoring attempts"
  on public.tutoring_attempts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own tutoring feedback" on public.tutoring_feedback_history;
create policy "Users can view their own tutoring feedback"
  on public.tutoring_feedback_history
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own tutoring feedback" on public.tutoring_feedback_history;
create policy "Users can create their own tutoring feedback"
  on public.tutoring_feedback_history
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own tutoring feedback" on public.tutoring_feedback_history;
create policy "Users can update their own tutoring feedback"
  on public.tutoring_feedback_history
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own tutoring feedback" on public.tutoring_feedback_history;
create policy "Users can delete their own tutoring feedback"
  on public.tutoring_feedback_history
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own skill mastery" on public.tutoring_skill_mastery;
create policy "Users can view their own skill mastery"
  on public.tutoring_skill_mastery
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own skill mastery" on public.tutoring_skill_mastery;
create policy "Users can create their own skill mastery"
  on public.tutoring_skill_mastery
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own skill mastery" on public.tutoring_skill_mastery;
create policy "Users can update their own skill mastery"
  on public.tutoring_skill_mastery
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own skill mastery" on public.tutoring_skill_mastery;
create policy "Users can delete their own skill mastery"
  on public.tutoring_skill_mastery
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.create_learner_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.learner_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_learner_profile on auth.users;
create trigger on_auth_user_created_create_learner_profile
after insert on auth.users
for each row
execute function public.create_learner_profile_for_new_user();

drop trigger if exists update_subject_domains_updated_at on public.subject_domains;
create trigger update_subject_domains_updated_at
before update on public.subject_domains
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_learner_profiles_updated_at on public.learner_profiles;
create trigger update_learner_profiles_updated_at
before update on public.learner_profiles
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_tutoring_topics_updated_at on public.tutoring_topics;
create trigger update_tutoring_topics_updated_at
before update on public.tutoring_topics
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_tutoring_skills_updated_at on public.tutoring_skills;
create trigger update_tutoring_skills_updated_at
before update on public.tutoring_skills
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_tutoring_scenarios_updated_at on public.tutoring_scenarios;
create trigger update_tutoring_scenarios_updated_at
before update on public.tutoring_scenarios
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_tutoring_scenario_questions_updated_at on public.tutoring_scenario_questions;
create trigger update_tutoring_scenario_questions_updated_at
before update on public.tutoring_scenario_questions
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_tutoring_sessions_updated_at on public.tutoring_sessions;
create trigger update_tutoring_sessions_updated_at
before update on public.tutoring_sessions
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_tutoring_skill_mastery_updated_at on public.tutoring_skill_mastery;
create trigger update_tutoring_skill_mastery_updated_at
before update on public.tutoring_skill_mastery
for each row
execute function public.update_updated_at_column();

insert into public.learner_profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
