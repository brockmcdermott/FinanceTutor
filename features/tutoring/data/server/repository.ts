import "server-only";

import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  CreateAttemptInput,
  CreateFeedbackHistoryInput,
  LearnerProgressDashboard,
  ScenarioFilters,
  ScenarioRecord,
  SkillMasteryRecord,
  StartSessionInput,
  TopicMasteryRecord,
  TopicSummary,
} from "@/features/tutoring/data/types";
import {
  getDefaultLearnerSkillState,
  updateLearnerSkillState,
} from "@/features/tutoring/learner/model";
import { learnerModelRules } from "@/features/tutoring/learner/rules";

const DEFAULT_SUBJECT_DOMAIN_SLUG = "business-finance";

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function toMasteryLevel(confidenceScore: number): SkillMasteryRecord["masteryLevel"] {
  if (confidenceScore >= 0.8) {
    return "proficient";
  }

  if (confidenceScore >= 0.55) {
    return "developing";
  }

  return "early";
}

function uniqueTags(tags: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      tags
        .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
        .map((tag) => tag.trim().toLowerCase())
    )
  );
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMetadata(value: unknown) {
  if (!isRecord(value)) {
    return {
      misconceptionCounts: {} as Record<string, number>,
      recentScores: [] as number[],
    };
  }

  const rawCounts = value.misconception_counts;
  const rawRecentScores = value.recent_scores;
  const misconceptionCounts = isRecord(rawCounts)
    ? Object.entries(rawCounts).reduce<Record<string, number>>((accumulator, [tag, count]) => {
        if (typeof count === "number" && Number.isFinite(count) && count > 0) {
          accumulator[tag] = count;
        }
        return accumulator;
      }, {})
    : {};

  const recentScores = Array.isArray(rawRecentScores)
    ? rawRecentScores
        .filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
        .map((entry) => clampScore(entry))
        .slice(-8)
    : [];

  return {
    misconceptionCounts,
    recentScores,
  };
}

type ScenarioRow = {
  id: string;
  slug: string;
  title: string;
  business_context: string;
  difficulty_level: string;
  display_order: number;
  estimated_minutes: number | null;
  topic: Record<string, unknown> | Array<Record<string, unknown>>;
  questions: Array<Record<string, unknown>> | null;
  skill_links: Array<Record<string, unknown>> | null;
};

function mapScenarioRow(row: ScenarioRow): ScenarioRecord {
  const rawQuestions = (row.questions as Array<Record<string, unknown>> | null) ?? [];
  const rawSkillLinks = (row.skill_links as Array<Record<string, unknown>> | null) ?? [];
  const rawTopic = row.topic as unknown;
  const topic = (Array.isArray(rawTopic) ? rawTopic[0] : rawTopic) as
    | Record<string, unknown>
    | undefined;

  if (!topic) {
    throw new Error(`Scenario ${String(row.id)} is missing topic data.`);
  }

  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    businessContext: row.business_context as string,
    difficultyLevel: row.difficulty_level as string,
    displayOrder: (row.display_order as number) ?? 1,
    estimatedMinutes: (row.estimated_minutes as number | null) ?? null,
    topic: {
      id: topic.id as string,
      slug: topic.slug as string,
      title: topic.title as string,
      summary: (topic.summary as string | null) ?? null,
      displayOrder: (topic.display_order as number) ?? 1,
    },
    skills: rawSkillLinks
      .map((link) => {
        const skill = link.skill as Record<string, unknown> | null;
        if (!skill) {
          return null;
        }

        return {
          id: skill.id as string,
          slug: skill.slug as string,
          name: skill.name as string,
          weight: Number(link.skill_weight ?? 1),
        };
      })
      .filter((skill): skill is ScenarioRecord["skills"][number] => skill !== null),
    questions: rawQuestions
      .map((question) => ({
        id: question.id as string,
        questionOrder: (question.question_order as number) ?? 1,
        prompt: question.prompt as string,
        responseFormat: (question.response_format as "numeric" | "short_text" | "mixed") ?? "mixed",
        numericAnswer:
          typeof question.numeric_answer === "number"
            ? question.numeric_answer
            : question.numeric_answer === null
              ? null
              : Number(question.numeric_answer),
        numericTolerance:
          typeof question.numeric_tolerance === "number"
            ? question.numeric_tolerance
            : question.numeric_tolerance === null
              ? null
              : Number(question.numeric_tolerance),
        unit: (question.unit as string | null) ?? null,
        explanationPrompt: (question.explanation_prompt as string | null) ?? null,
        hint: (question.hint as string | null) ?? null,
        rubric: (question.rubric as Record<string, unknown>) ?? {},
      }))
      .sort((a, b) => a.questionOrder - b.questionOrder),
  };
}

function getAuthenticatedUserId(claims: Awaited<ReturnType<typeof requireAuth>>) {
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    throw new Error("Authenticated user id was not available in auth claims.");
  }

  return claims.sub;
}

async function resolveSubjectDomainId(subjectDomainSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subject_domains")
    .select("id, slug")
    .eq("slug", subjectDomainSlug)
    .single();

  if (error || !data) {
    throw new Error(`Unable to resolve subject domain: ${subjectDomainSlug}`);
  }

  return data.id as string;
}

async function fetchDomainSkills({
  subjectDomainId,
}: {
  subjectDomainId: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutoring_skills")
    .select("id, slug, name, display_order")
    .eq("subject_domain_id", subjectDomainId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tutoring skills: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    displayOrder: (row.display_order as number) ?? 1,
  }));
}

export async function fetchAvailableTopics({
  subjectDomainSlug = DEFAULT_SUBJECT_DOMAIN_SLUG,
}: {
  subjectDomainSlug?: string;
} = {}): Promise<TopicSummary[]> {
  const subjectDomainId = await resolveSubjectDomainId(subjectDomainSlug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tutoring_topics")
    .select("id, slug, title, summary, display_order, subject_domain_id")
    .eq("subject_domain_id", subjectDomainId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    summary: (row.summary as string | null) ?? null,
    displayOrder: (row.display_order as number) ?? 1,
    subjectDomainId: row.subject_domain_id as string,
  }));
}

export async function fetchScenariosByFilters(
  filters: ScenarioFilters = {}
): Promise<ScenarioRecord[]> {
  const subjectDomainId = await resolveSubjectDomainId(
    filters.subjectDomainSlug ?? DEFAULT_SUBJECT_DOMAIN_SLUG
  );
  const supabase = await createClient();

  let query = supabase
    .from("tutoring_scenarios")
    .select(
      `
        id,
        slug,
        title,
        business_context,
        difficulty_level,
        display_order,
        estimated_minutes,
        topic:tutoring_topics!inner(
          id,
          slug,
          title,
          summary,
          display_order,
          subject_domain_id,
          is_active
        ),
        questions:tutoring_scenario_questions(
          id,
          question_order,
          prompt,
          response_format,
          numeric_answer,
          numeric_tolerance,
          unit,
          explanation_prompt,
          hint,
          rubric
        ),
        skill_links:tutoring_scenario_skills(
          skill_weight,
          skill:tutoring_skills!inner(
            id,
            slug,
            name,
            is_active
          )
        )
      `
    )
    .eq("is_active", true)
    .eq("tutoring_topics.subject_domain_id", subjectDomainId)
    .eq("tutoring_topics.is_active", true)
    .order("display_order", { ascending: true });

  if (filters.topicSlug) {
    query = query.eq("tutoring_topics.slug", filters.topicSlug);
  }

  if (filters.difficultyLevel) {
    query = query.eq("difficulty_level", filters.difficultyLevel);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch scenarios: ${error.message}`);
  }

  const mapped: ScenarioRecord[] = (data ?? []).map((row) => mapScenarioRow(row as ScenarioRow));

  const filteredBySkill = filters.skillSlug
    ? mapped.filter((scenario) =>
        scenario.skills.some((skill) => skill.slug === filters.skillSlug)
      )
    : mapped;

  if (filters.limit && filters.limit > 0) {
    return filteredBySkill.slice(0, filters.limit);
  }

  return filteredBySkill;
}

export async function startTutoringSession(input: StartSessionInput = {}) {
  const userClaims = await requireAuth();
  const userId = getAuthenticatedUserId(userClaims);
  const subjectDomainSlug = input.subjectDomainSlug ?? DEFAULT_SUBJECT_DOMAIN_SLUG;
  const subjectDomainId = await resolveSubjectDomainId(subjectDomainSlug);
  const supabase = await createClient();

  let topicId: string | null = null;
  if (input.topicSlug) {
    const { data: topic, error: topicError } = await supabase
      .from("tutoring_topics")
      .select("id")
      .eq("subject_domain_id", subjectDomainId)
      .eq("slug", input.topicSlug)
      .single();

    if (topicError || !topic) {
      throw new Error(`Topic not found for slug: ${input.topicSlug}`);
    }

    topicId = topic.id as string;
  }

  const { data, error } = await supabase
    .from("tutoring_sessions")
    .insert({
      user_id: userId,
      subject_domain_id: subjectDomainId,
      topic_id: topicId,
      metadata: input.metadata ?? {},
    })
    .select("id, user_id, subject_domain_id, topic_id, status, started_at, ended_at")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create tutoring session: ${error?.message ?? "Unknown error"}`);
  }

  return data;
}

export async function fetchScenarioById(scenarioId: string): Promise<ScenarioRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tutoring_scenarios")
    .select(
      `
        id,
        slug,
        title,
        business_context,
        difficulty_level,
        display_order,
        estimated_minutes,
        topic:tutoring_topics!inner(
          id,
          slug,
          title,
          summary,
          display_order,
          subject_domain_id,
          is_active
        ),
        questions:tutoring_scenario_questions(
          id,
          question_order,
          prompt,
          response_format,
          numeric_answer,
          numeric_tolerance,
          unit,
          explanation_prompt,
          hint,
          rubric
        ),
        skill_links:tutoring_scenario_skills(
          skill_weight,
          skill:tutoring_skills!inner(
            id,
            slug,
            name,
            is_active
          )
        )
      `
    )
    .eq("id", scenarioId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return mapScenarioRow(data as ScenarioRow);
}

export async function fetchScenarioQuestionById({
  scenarioId,
  questionId,
}: {
  scenarioId: string;
  questionId: string;
}) {
  const scenario = await fetchScenarioById(scenarioId);
  if (!scenario) {
    return null;
  }

  return scenario.questions.find((question) => question.id === questionId) ?? null;
}

export async function createTutoringAttempt(input: CreateAttemptInput) {
  const userClaims = await requireAuth();
  const userId = getAuthenticatedUserId(userClaims);
  const supabase = await createClient();

  const { data: questionRecord, error: questionError } = await supabase
    .from("tutoring_scenario_questions")
    .select("id")
    .eq("id", input.questionId)
    .eq("scenario_id", input.scenarioId)
    .single();

  if (questionError || !questionRecord) {
    throw new Error("Question does not belong to the provided scenario.");
  }

  let attemptNumber = Math.max(1, input.attemptNumber ?? 0);
  if (!input.attemptNumber) {
    const { data: lastAttempt } = await supabase
      .from("tutoring_attempts")
      .select("attempt_number")
      .eq("user_id", userId)
      .eq("scenario_id", input.scenarioId)
      .eq("question_id", input.questionId)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    attemptNumber = ((lastAttempt?.attempt_number as number | undefined) ?? 0) + 1;
  }

  const payload = {
    user_id: userId,
    session_id: input.sessionId ?? null,
    scenario_id: input.scenarioId,
    question_id: input.questionId,
    attempt_number: attemptNumber,
    numeric_answer: input.numericAnswer ?? null,
    short_text_answer: input.shortTextAnswer ?? null,
    correctness_score:
      typeof input.correctnessScore === "number"
        ? clampScore(input.correctnessScore)
        : null,
    is_numeric_correct:
      typeof input.isNumericCorrect === "boolean" ? input.isNumericCorrect : null,
    misconception_tags: uniqueTags(input.misconceptionTags ?? []),
    duration_seconds: input.durationSeconds ?? null,
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase
    .from("tutoring_attempts")
    .insert(payload)
    .select(
      "id, user_id, session_id, scenario_id, question_id, attempt_number, correctness_score, is_numeric_correct, submitted_at"
    )
    .single();

  if (error || !data) {
    throw new Error(`Failed to create tutoring attempt: ${error?.message ?? "Unknown error"}`);
  }

  return data;
}

export async function createTutoringFeedbackHistory(input: CreateFeedbackHistoryInput) {
  const userClaims = await requireAuth();
  const userId = getAuthenticatedUserId(userClaims);
  const supabase = await createClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("tutoring_attempts")
    .select("id")
    .eq("id", input.attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attempt) {
    throw new Error("Attempt not found for current user.");
  }

  const { data, error } = await supabase
    .from("tutoring_feedback_history")
    .insert({
      user_id: userId,
      attempt_id: input.attemptId,
      provider_mode: input.providerMode,
      model_name: input.modelName ?? null,
      feedback_summary: input.feedbackSummary,
      strengths: input.strengths ?? [],
      improvements: input.improvements ?? [],
      recommended_next_step: input.recommendedNextStep ?? "repeat",
      hint_provided: input.hintProvided ?? null,
      score:
        typeof input.score === "number"
          ? clampScore(input.score)
          : null,
      raw_feedback: input.rawFeedback ?? {},
    })
    .select(
      "id, user_id, attempt_id, provider_mode, model_name, feedback_summary, recommended_next_step, score, created_at"
    )
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create tutoring feedback history: ${error?.message ?? "Unknown error"}`
    );
  }

  return data;
}

export async function fetchLearnerSkillMastery({
  subjectDomainSlug = DEFAULT_SUBJECT_DOMAIN_SLUG,
}: {
  subjectDomainSlug?: string;
} = {}): Promise<SkillMasteryRecord[]> {
  const userClaims = await requireAuth();
  const userId = getAuthenticatedUserId(userClaims);
  const subjectDomainId = await resolveSubjectDomainId(subjectDomainSlug);
  const supabase = await createClient();

  const domainSkills = await fetchDomainSkills({ subjectDomainId });
  if (domainSkills.length === 0) {
    return [];
  }

  const skillIds = domainSkills.map((skill) => skill.id);
  const skillById = new Map(domainSkills.map((skill) => [skill.id, skill]));

  const { data, error } = await supabase
    .from("tutoring_skill_mastery")
    .select(
      "id, skill_id, confidence_score, mastery_level, recent_correct_count, recent_attempt_count, current_streak, last_practiced_at, misconception_tags, metadata"
    )
    .eq("user_id", userId)
    .in("skill_id", skillIds);

  if (error) {
    throw new Error(`Failed to fetch learner mastery rows: ${error.message}`);
  }

  const rowsBySkillId = new Map((data ?? []).map((row) => [row.skill_id as string, row]));

  return skillIds.map((skillId) => {
    const skill = skillById.get(skillId);
    const row = rowsBySkillId.get(skillId);
    const metadata = parseMetadata(row?.metadata);

    if (!row || !skill) {
      const fallbackState = getDefaultLearnerSkillState();
      return {
        id: `virtual-${skillId}`,
        skillId,
        skillSlug: skill?.slug ?? "",
        skillName: skill?.name ?? "",
        confidenceScore: fallbackState.confidenceScore,
        masteryLevel: toMasteryLevel(fallbackState.confidenceScore),
        recentCorrectCount: 0,
        recentAttemptCount: 0,
        currentStreak: 0,
        lastPracticedAt: null,
        misconceptionTags: [],
        misconceptionCounts: {},
        recentScores: [],
      } satisfies SkillMasteryRecord;
    }

    return {
      id: row.id as string,
      skillId: row.skill_id as string,
      skillSlug: skill.slug,
      skillName: skill.name,
      confidenceScore: (row.confidence_score as number) ?? learnerModelRules.defaultConfidenceScore,
      masteryLevel: row.mastery_level as SkillMasteryRecord["masteryLevel"],
      recentCorrectCount: (row.recent_correct_count as number) ?? 0,
      recentAttemptCount: (row.recent_attempt_count as number) ?? 0,
      currentStreak: (row.current_streak as number) ?? 0,
      lastPracticedAt: (row.last_practiced_at as string | null) ?? null,
      misconceptionTags: (row.misconception_tags as string[] | null) ?? [],
      misconceptionCounts: metadata.misconceptionCounts,
      recentScores: metadata.recentScores,
    } satisfies SkillMasteryRecord;
  });
}

export async function fetchLearnerProgressDashboard({
  subjectDomainSlug = DEFAULT_SUBJECT_DOMAIN_SLUG,
}: {
  subjectDomainSlug?: string;
} = {}): Promise<LearnerProgressDashboard> {
  const userClaims = await requireAuth();
  const userId = getAuthenticatedUserId(userClaims);
  const subjectDomainId = await resolveSubjectDomainId(subjectDomainSlug);
  const supabase = await createClient();

  const topics = await fetchAvailableTopics({ subjectDomainSlug });
  const topicIds = topics.map((topic) => topic.id);

  const domainSkills = await fetchDomainSkills({ subjectDomainId });
  const skillMastery = await fetchLearnerSkillMastery({ subjectDomainSlug });
  const skillMasteryById = new Map(skillMastery.map((row) => [row.skillId, row]));

  const { data: topicSkillRows, error: topicSkillError } = await supabase
    .from("tutoring_topic_skills")
    .select("topic_id, skill_id")
    .in("topic_id", topicIds.length > 0 ? topicIds : ["00000000-0000-0000-0000-000000000000"]);

  if (topicSkillError) {
    throw new Error(`Failed to load topic-skill links: ${topicSkillError.message}`);
  }

  const skillIdsByTopic = new Map<string, string[]>();
  (topicSkillRows ?? []).forEach((row) => {
    const topicId = row.topic_id as string;
    const skillId = row.skill_id as string;
    const existing = skillIdsByTopic.get(topicId) ?? [];
    skillIdsByTopic.set(topicId, [...existing, skillId]);
  });

  const { data: scenarioRows, error: scenarioError } = await supabase
    .from("tutoring_scenarios")
    .select("id, topic_id")
    .in("topic_id", topicIds.length > 0 ? topicIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_active", true);

  if (scenarioError) {
    throw new Error(`Failed to load scenarios for progress dashboard: ${scenarioError.message}`);
  }

  const scenarioIds = (scenarioRows ?? []).map((row) => row.id as string);
  const topicIdByScenarioId = new Map(
    (scenarioRows ?? []).map((row) => [row.id as string, row.topic_id as string])
  );

  const { data: attemptRows, error: attemptsError } = await supabase
    .from("tutoring_attempts")
    .select("id, scenario_id, correctness_score, submitted_at")
    .eq("user_id", userId)
    .in(
      "scenario_id",
      scenarioIds.length > 0 ? scenarioIds : ["00000000-0000-0000-0000-000000000000"]
    )
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (attemptsError) {
    throw new Error(`Failed to load attempts for progress dashboard: ${attemptsError.message}`);
  }

  const attemptsByTopicId = new Map<
    string,
    Array<{
      score: number;
      submittedAt: string;
    }>
  >();

  (attemptRows ?? []).forEach((row) => {
    const topicId = topicIdByScenarioId.get(row.scenario_id as string);
    if (!topicId) {
      return;
    }

    const list = attemptsByTopicId.get(topicId) ?? [];
    list.push({
      score:
        typeof row.correctness_score === "number"
          ? clampScore(row.correctness_score)
          : 0,
      submittedAt: row.submitted_at as string,
    });
    attemptsByTopicId.set(topicId, list);
  });

  const topicMastery: TopicMasteryRecord[] = topics.map((topic) => {
    const skillIds = skillIdsByTopic.get(topic.id) ?? [];
    const relatedSkills =
      skillIds.length > 0
        ? skillIds
            .map((skillId) => skillMasteryById.get(skillId))
            .filter((skill): skill is SkillMasteryRecord => Boolean(skill))
        : [];

    const masteryScore =
      relatedSkills.length > 0
        ? average(relatedSkills.map((skill) => clampScore(skill.confidenceScore)))
        : learnerModelRules.defaultConfidenceScore;

    const attempts = attemptsByTopicId.get(topic.id) ?? [];
    const latestThree = attempts.slice(0, 3).map((attempt) => attempt.score);
    const previousThree = attempts.slice(3, 6).map((attempt) => attempt.score);
    const trendDelta =
      previousThree.length > 0 ? average(latestThree) - average(previousThree) : 0;
    const trendDirection: TopicMasteryRecord["trendDirection"] =
      trendDelta > 0.06 ? "improving" : trendDelta < -0.06 ? "declining" : "steady";

    const lastPracticedAt =
      attempts[0]?.submittedAt ??
      relatedSkills
        .map((skill) => skill.lastPracticedAt)
        .filter((value): value is string => typeof value === "string")
        .sort((left, right) => right.localeCompare(left))[0] ??
      null;

    const weakTagCounts = relatedSkills.reduce<Record<string, number>>((accumulator, skill) => {
      Object.entries(skill.misconceptionCounts ?? {}).forEach(([tag, count]) => {
        accumulator[tag] = (accumulator[tag] ?? 0) + count;
      });
      return accumulator;
    }, {});

    const weakTags = Object.entries(weakTagCounts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([tag]) => tag);

    return {
      topicId: topic.id,
      topicSlug: topic.slug,
      topicTitle: topic.title,
      masteryScore,
      masteryLevel: toMasteryLevel(masteryScore),
      recentAttempts: attempts.length,
      trendDelta,
      trendDirection,
      lastPracticedAt,
      weakTags,
    } satisfies TopicMasteryRecord;
  });

  const recentlyPracticed = [...topicMastery]
    .filter((topic) => topic.lastPracticedAt)
    .sort((left, right) =>
      (right.lastPracticedAt ?? "").localeCompare(left.lastPracticedAt ?? "")
    )
    .slice(0, 4);

  const weakSkills = domainSkills
    .map((skill) => skillMasteryById.get(skill.id))
    .filter((skill): skill is SkillMasteryRecord => Boolean(skill))
    .sort((left, right) => left.confidenceScore - right.confidenceScore)
    .slice(0, 5);

  const attemptScores = (attemptRows ?? []).map((attempt) =>
    typeof attempt.correctness_score === "number" ? clampScore(attempt.correctness_score) : 0
  );

  return {
    topicMastery,
    recentlyPracticed,
    weakSkills,
    totalAttempts: (attemptRows ?? []).length,
    averageRecentScore: average(attemptScores.slice(0, 20)),
  } satisfies LearnerProgressDashboard;
}

export async function updateLearnerProgressFromAttempt(attemptId: string) {
  const userClaims = await requireAuth();
  const userId = getAuthenticatedUserId(userClaims);
  const supabase = await createClient();

  const { data: attempt, error: attemptError } = await supabase
    .from("tutoring_attempts")
    .select("id, user_id, scenario_id, correctness_score, is_numeric_correct, misconception_tags, submitted_at")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .single();

  if (attemptError || !attempt) {
    throw new Error("Attempt not found for current user.");
  }

  const { data: scenarioSkills, error: scenarioSkillsError } = await supabase
    .from("tutoring_scenario_skills")
    .select("skill_id")
    .eq("scenario_id", attempt.scenario_id);

  if (scenarioSkillsError) {
    throw new Error(`Failed to load scenario skills: ${scenarioSkillsError.message}`);
  }

  const skillIds = (scenarioSkills ?? []).map((row) => row.skill_id as string);
  if (skillIds.length === 0) {
    return [];
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("tutoring_skill_mastery")
    .select(
      "id, skill_id, confidence_score, recent_correct_count, recent_attempt_count, current_streak, misconception_tags, metadata, last_practiced_at"
    )
    .eq("user_id", userId)
    .in("skill_id", skillIds);

  if (existingError) {
    throw new Error(`Failed to fetch current mastery rows: ${existingError.message}`);
  }

  const { data: skillRows, error: skillError } = await supabase
    .from("tutoring_skills")
    .select("id, slug, name")
    .in("id", skillIds);

  if (skillError) {
    throw new Error(`Failed to load skills for mastery update: ${skillError.message}`);
  }

  const skillById = new Map(
    (skillRows ?? []).map((row) => [
      row.id as string,
      {
        slug: row.slug as string,
        name: row.name as string,
      },
    ])
  );

  const existingBySkillId = new Map(
    (existingRows ?? []).map((row) => [row.skill_id as string, row])
  );

  const rawScore =
    typeof attempt.correctness_score === "number"
      ? clampScore(attempt.correctness_score)
      : attempt.is_numeric_correct
        ? 1
        : 0;
  const misconceptionTags = uniqueTags((attempt.misconception_tags as string[] | null) ?? []);
  const submittedAt =
    (attempt.submitted_at as string | null) ?? new Date().toISOString();

  const upsertRows = skillIds.map((skillId) => {
    const existing = existingBySkillId.get(skillId);
    const previousMetadata = parseMetadata(existing?.metadata);
    const fallbackState = getDefaultLearnerSkillState();
    const previousState = {
      confidenceScore:
        typeof existing?.confidence_score === "number"
          ? clampScore(existing.confidence_score)
          : fallbackState.confidenceScore,
      recentCorrectCount:
        (existing?.recent_correct_count as number | undefined) ??
        fallbackState.recentCorrectCount,
      recentAttemptCount:
        (existing?.recent_attempt_count as number | undefined) ??
        fallbackState.recentAttemptCount,
      currentStreak:
        (existing?.current_streak as number | undefined) ?? fallbackState.currentStreak,
      misconceptionTags: uniqueTags((existing?.misconception_tags as string[] | null) ?? []),
      misconceptionCounts: previousMetadata.misconceptionCounts,
      recentScores: previousMetadata.recentScores,
    };

    const nextState = updateLearnerSkillState({
      previousState,
      signal: {
        score: rawScore,
        numericCorrect:
          typeof attempt.is_numeric_correct === "boolean" ? attempt.is_numeric_correct : null,
        misconceptionTags,
        submittedAt,
      },
    });

    return {
      user_id: userId,
      skill_id: skillId,
      confidence_score: nextState.confidenceScore,
      mastery_level: nextState.masteryLevel,
      recent_correct_count: Math.min(
        nextState.recentCorrectCount,
        learnerModelRules.maxRecentAttempts
      ),
      recent_attempt_count: Math.min(
        nextState.recentAttemptCount,
        learnerModelRules.maxRecentAttempts
      ),
      current_streak: nextState.currentStreak,
      last_practiced_at: nextState.lastPracticedAt,
      misconception_tags: nextState.misconceptionTags,
      metadata: {
        misconception_counts: nextState.misconceptionCounts,
        recent_scores: nextState.recentScores,
      },
    };
  });

  const { data, error } = await supabase
    .from("tutoring_skill_mastery")
    .upsert(upsertRows, { onConflict: "user_id,skill_id" })
    .select(
      "id, skill_id, confidence_score, mastery_level, recent_correct_count, recent_attempt_count, current_streak, last_practiced_at, misconception_tags, metadata"
    );

  if (error) {
    throw new Error(`Failed to update mastery rows: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    skillId: row.skill_id as string,
    skillSlug: skillById.get(row.skill_id as string)?.slug,
    skillName: skillById.get(row.skill_id as string)?.name,
    confidenceScore: row.confidence_score as number,
    masteryLevel: row.mastery_level as SkillMasteryRecord["masteryLevel"],
    recentCorrectCount: row.recent_correct_count as number,
    recentAttemptCount: row.recent_attempt_count as number,
    currentStreak: row.current_streak as number,
    lastPracticedAt: (row.last_practiced_at as string | null) ?? null,
    misconceptionTags: (row.misconception_tags as string[] | null) ?? [],
    misconceptionCounts: parseMetadata(row.metadata).misconceptionCounts,
    recentScores: parseMetadata(row.metadata).recentScores,
  }));
}
