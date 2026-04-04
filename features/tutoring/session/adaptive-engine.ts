import { ScenarioRecord, SkillMasteryRecord } from "@/features/tutoring/data/types";
import { difficultyRank, sequencingRules } from "@/features/tutoring/learner/rules";

export type AdaptiveStrategy = "remediation" | "scaffold" | "reinforce" | "advance";

export interface AdaptiveRecommendation {
  strategy: AdaptiveStrategy;
  reason: string;
  nextScenarioId: string;
  nextScenarioTitle: string;
  nextTopicSlug: string;
  nextTopicTitle: string;
  targetSkillSlug: string | null;
  targetSkillName: string | null;
}

function toDifficultyValue(level: string) {
  return difficultyRank[level] ?? 1;
}

function hasSharedSkill(base: ScenarioRecord, candidate: ScenarioRecord) {
  const baseSkillIds = new Set(base.skills.map((skill) => skill.id));
  return candidate.skills.some((skill) => baseSkillIds.has(skill.id));
}

function uniqueScenarios(scenarios: ScenarioRecord[]) {
  const seen = new Set<string>();
  return scenarios.filter((scenario) => {
    if (seen.has(scenario.id)) {
      return false;
    }
    seen.add(scenario.id);
    return true;
  });
}

function sortByClosenessToCurrent({
  scenarios,
  currentScenario,
}: {
  scenarios: ScenarioRecord[];
  currentScenario: ScenarioRecord;
}) {
  return [...scenarios].sort((left, right) => {
    const leftTopicBoost = left.topic.id === currentScenario.topic.id ? -1 : 0;
    const rightTopicBoost = right.topic.id === currentScenario.topic.id ? -1 : 0;

    const leftDifficultyDelta = Math.abs(
      toDifficultyValue(left.difficultyLevel) - toDifficultyValue(currentScenario.difficultyLevel)
    );
    const rightDifficultyDelta = Math.abs(
      toDifficultyValue(right.difficultyLevel) - toDifficultyValue(currentScenario.difficultyLevel)
    );

    if (leftTopicBoost !== rightTopicBoost) {
      return leftTopicBoost - rightTopicBoost;
    }

    if (leftDifficultyDelta !== rightDifficultyDelta) {
      return leftDifficultyDelta - rightDifficultyDelta;
    }

    return left.displayOrder - right.displayOrder;
  });
}

function selectScenarioOrFallback({
  candidatePool,
  fallbackPool,
  currentScenario,
}: {
  candidatePool: ScenarioRecord[];
  fallbackPool: ScenarioRecord[];
  currentScenario: ScenarioRecord;
}) {
  const withoutCurrent = uniqueScenarios(candidatePool).filter(
    (scenario) => scenario.id !== currentScenario.id
  );

  if (withoutCurrent.length > 0) {
    return sortByClosenessToCurrent({ scenarios: withoutCurrent, currentScenario })[0];
  }

  const fallbackWithoutCurrent = uniqueScenarios(fallbackPool).filter(
    (scenario) => scenario.id !== currentScenario.id
  );

  return (
    sortByClosenessToCurrent({
      scenarios: fallbackWithoutCurrent.length > 0 ? fallbackWithoutCurrent : fallbackPool,
      currentScenario,
    })[0] ?? currentScenario
  );
}

function findCurrentSkillMastery({
  currentScenario,
  skillMastery,
}: {
  currentScenario: ScenarioRecord;
  skillMastery: SkillMasteryRecord[];
}) {
  return currentScenario.skills
    .map((skill) => {
      const mastery = skillMastery.find((row) => row.skillId === skill.id);
      const repeatedTags = Object.entries(mastery?.misconceptionCounts ?? {})
        .filter(([, count]) => count >= sequencingRules.repeatedMistakeThreshold)
        .map(([tag]) => tag);

      return {
        skill,
        mastery,
        confidenceScore: mastery?.confidenceScore ?? 0.35,
        repeatedTags,
      };
    })
    .sort((left, right) => left.confidenceScore - right.confidenceScore);
}

function deriveStrategy({
  score,
  misconceptionTags,
  currentSkillMastery,
}: {
  score: number;
  misconceptionTags: string[];
  currentSkillMastery: ReturnType<typeof findCurrentSkillMastery>;
}): AdaptiveStrategy {
  const repeatedMistakesPresent = currentSkillMastery.some(
    (item) =>
      item.repeatedTags.length > 0 ||
      misconceptionTags.some((tag) => item.repeatedTags.includes(tag))
  );

  if (repeatedMistakesPresent || score < sequencingRules.remediationScoreThreshold) {
    return "remediation";
  }

  if (score < sequencingRules.reinforceScoreThreshold || misconceptionTags.length >= 2) {
    return "scaffold";
  }

  if (score >= sequencingRules.advanceScoreThreshold && misconceptionTags.length === 0) {
    return "advance";
  }

  return "reinforce";
}

function filterByTargetSkill({
  scenarios,
  targetSkillId,
}: {
  scenarios: ScenarioRecord[];
  targetSkillId: string | null;
}) {
  if (!targetSkillId) {
    return scenarios;
  }

  return scenarios.filter((scenario) => scenario.skills.some((skill) => skill.id === targetSkillId));
}

function pickWeakestOtherSkill({
  currentScenario,
  skillMastery,
}: {
  currentScenario: ScenarioRecord;
  skillMastery: SkillMasteryRecord[];
}) {
  const currentSkillIds = new Set(currentScenario.skills.map((skill) => skill.id));
  const candidates = skillMastery
    .filter((skill) => !currentSkillIds.has(skill.skillId))
    .sort((left, right) => left.confidenceScore - right.confidenceScore);
  return candidates[0] ?? null;
}

export function selectAdaptiveRecommendation({
  currentScenario,
  availableScenarios,
  skillMastery,
  submissionScore,
  submissionMisconceptionTags,
}: {
  currentScenario: ScenarioRecord;
  availableScenarios: ScenarioRecord[];
  skillMastery: SkillMasteryRecord[];
  submissionScore: number;
  submissionMisconceptionTags: string[];
}): AdaptiveRecommendation {
  const currentDifficultyValue = toDifficultyValue(currentScenario.difficultyLevel);
  const currentSkillMastery = findCurrentSkillMastery({ currentScenario, skillMastery });
  const weakestCurrentSkill = currentSkillMastery[0] ?? null;

  const strategy = deriveStrategy({
    score: submissionScore,
    misconceptionTags: submissionMisconceptionTags,
    currentSkillMastery,
  });

  const sameSkillScenarios = availableScenarios.filter((scenario) =>
    hasSharedSkill(currentScenario, scenario)
  );

  let targetSkillId: string | null = weakestCurrentSkill?.skill.id ?? null;
  let targetSkillSlug: string | null = weakestCurrentSkill?.skill.slug ?? null;
  let targetSkillName: string | null = weakestCurrentSkill?.skill.name ?? null;

  if (strategy === "advance") {
    const weakestOtherSkill = pickWeakestOtherSkill({ currentScenario, skillMastery });
    if (weakestOtherSkill && weakestOtherSkill.confidenceScore < 0.6) {
      targetSkillId = weakestOtherSkill.skillId;
      targetSkillSlug = weakestOtherSkill.skillSlug ?? null;
      targetSkillName = weakestOtherSkill.skillName ?? null;
    }
  }

  const scenariosForTargetSkill = filterByTargetSkill({
    scenarios: availableScenarios,
    targetSkillId,
  });

  const easierOrFoundationCandidates = scenariosForTargetSkill.filter(
    (scenario) =>
      toDifficultyValue(scenario.difficultyLevel) <= currentDifficultyValue &&
      scenario.difficultyLevel === "foundation"
  );
  const reinforceCandidates = sameSkillScenarios.filter(
    (scenario) => toDifficultyValue(scenario.difficultyLevel) === currentDifficultyValue
  );
  const harderCandidates = scenariosForTargetSkill.filter(
    (scenario) => toDifficultyValue(scenario.difficultyLevel) > currentDifficultyValue
  );

  const chosenScenario =
    strategy === "remediation"
      ? selectScenarioOrFallback({
          candidatePool: easierOrFoundationCandidates,
          fallbackPool: sameSkillScenarios,
          currentScenario,
        })
      : strategy === "scaffold"
        ? selectScenarioOrFallback({
            candidatePool: easierOrFoundationCandidates,
            fallbackPool: reinforceCandidates.length > 0 ? reinforceCandidates : sameSkillScenarios,
            currentScenario,
          })
        : strategy === "advance"
          ? selectScenarioOrFallback({
              candidatePool: harderCandidates.length > 0 ? harderCandidates : scenariosForTargetSkill,
              fallbackPool: availableScenarios,
              currentScenario,
            })
          : selectScenarioOrFallback({
              candidatePool: reinforceCandidates.length > 0 ? reinforceCandidates : sameSkillScenarios,
              fallbackPool: availableScenarios,
              currentScenario,
            });

  const reason =
    strategy === "remediation"
      ? "You hit a repeated misconception, so the next scenario prioritizes concept repair with scaffolding."
      : strategy === "scaffold"
        ? "You are close. The next scenario keeps the same concept with more guided structure."
        : strategy === "advance"
          ? "Strong performance. The next scenario increases challenge or shifts to an adjacent weak skill."
          : "You are building consistency. The next scenario reinforces the same skill at a similar level.";

  return {
    strategy,
    reason,
    nextScenarioId: chosenScenario.id,
    nextScenarioTitle: chosenScenario.title,
    nextTopicSlug: chosenScenario.topic.slug,
    nextTopicTitle: chosenScenario.topic.title,
    targetSkillSlug,
    targetSkillName,
  };
}
